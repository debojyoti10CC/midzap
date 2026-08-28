/**
 * Recipes are text-level codemods. Each one recognises a common "self-reported
 * control gates an action" shape in a React component and rewrites it to a
 * MidnightZap zero-knowledge gate. Imports and the <MidnightZapProvider>
 * wrapper are added structurally (see project.ts); the swap itself is done on
 * source text so the output stays formatted the way the file already is.
 */

export interface Recipe {
  id: string;
  title: string;
  /** dir name under the SDK's compiled circuits, copied into the target. */
  circuit: string;
  predicateKind: "threshold" | "membership" | "credential-valid";
  imports: string[];
  providerProps: string;
  /** Rewrite `src`; return new text + a note, or null if nothing matched. */
  apply(src: string): { text: string; note: string } | null;
}

const BUTTON = /<button\b[^>]*>[\s\S]*?<\/button>/;

/** Remove a `!var` term (and a neighbouring `||`) from a boolean expression. */
function stripGuard(expr: string, v: string): string {
  return expr
    .replace(new RegExp(`!\\s*${v}\\s*\\|\\|\\s*`), "")
    .replace(new RegExp(`\\s*\\|\\|\\s*!\\s*${v}`), "")
    .replace(new RegExp(`^!\\s*${v}$`), "")
    .trim();
}

/** Find the state variable a control is bound to (`checked={x}` / `setX`). */
function boundVar(fragment: string): string | null {
  return (
    fragment.match(/checked=\{(\w+)\}/)?.[1] ??
    fragment.match(/set([A-Z]\w*)/)?.[1]?.replace(/^./, (c) => c.toLowerCase()) ??
    null
  );
}

function wrapGatedButton(src: string, gateRegion: RegExp, openTag: string, closeTag: string): { text: string; note: string } | null {
  const gate = src.match(gateRegion);
  if (!gate) return null;
  const v = boundVar(gate[0]);
  if (!v) return null;

  // The gated element: the first <button> after the gate that is disabled by `v`.
  const after = src.slice(gate.index! + gate[0].length);
  const btn = after.match(BUTTON);
  if (!btn || !new RegExp(`disabled=\\{[^}]*\\b${v}\\b[^}]*\\}`).test(btn[0])) return null;

  const newBtn = btn[0]
    .replace(/disabled=\{([^}]*)\}/, (_m, expr) => {
      const stripped = stripGuard(expr, v);
      return stripped ? `disabled={${stripped}}` : "";
    })
    .replace(/\s+>/, ">");

  const from = gate.index!;
  const to = gate.index! + gate[0].length + btn.index! + btn[0].length;
  const indent = src.slice(0, from).match(/[^\n]*$/)?.[0] ?? "";
  const btnLines = newBtn.trim().split("\n");
  const reindented = btnLines
    .map((l, i) => {
      if (i === 0) return l;
      const t = l.trim();
      return `${indent}${t.startsWith("</") ? "  " : "    "}${t}`;
    })
    .join("\n");
  const replacement = `${openTag}\n${indent}  ${reindented}\n${indent}${closeTag}`;

  return {
    text: src.slice(0, from) + replacement + src.slice(to),
    note: `swapped the self-reported control for <${closeTag.replace(/[<>/]/g, "")}> around the gated button`,
  };
}

export const RECIPES: Record<string, Recipe> = {
  "age-gate": {
    id: "age-gate",
    title: "Private age check — ProveThreshold",
    circuit: "threshold",
    predicateKind: "threshold",
    imports: ["ProveThreshold"],
    providerProps: `backend={backend} contracts={contracts} network="testnet"`,
    apply: (src) =>
      wrapGatedButton(
        src,
        /<label\b[\s\S]*?type=["']checkbox["'][\s\S]*?<\/label>/,
        `<ProveThreshold\n          field="age"\n          threshold={21}\n          getPrivateValue={() => new Date().getFullYear() - /* TODO: user's birth year */ 2000}\n        >`,
        `</ProveThreshold>`
      ),
  },

  "credential-check": {
    id: "credential-check",
    title: "Private credential-valid check — ProveCredentialValid",
    circuit: "expiry",
    predicateKind: "credential-valid",
    imports: ["ProveCredentialValid"],
    providerProps: `backend={backend} contracts={contracts} network="testnet"`,
    apply: (src) =>
      wrapGatedButton(
        src,
        /<label\b[\s\S]*?type=["']file["'][\s\S]*?<\/label>/,
        `<ProveCredentialValid\n          issuer="trusted-issuer"\n          getExpiresAtUnix={() => /* TODO: your credential's expiry (unix s) */ Math.floor(Date.now() / 1000) + 86400}\n          getExtraWitness={() => ({ credentialHash: /* TODO */ "00".repeat(32) })}\n        >`,
        `</ProveCredentialValid>`
      ),
  },

  "anon-login": {
    id: "anon-login",
    title: "Anonymous verified login — ProveMembership",
    circuit: "membership",
    predicateKind: "membership",
    imports: ["ProveMembership"],
    providerProps: `backend={backend} contracts={contracts} network="testnet"`,
    apply(src) {
      // Shape: `{loggedIn ? <composer/> : <button>Log in…</button>}`
      const m = src.match(
        /\{\s*(\w+)\s*\?\s*\(([\s\S]*?)\)\s*:\s*\(([\s\S]*?<button\b[\s\S]*?(?:log\s*in|sign\s*in)[\s\S]*?<\/button>[\s\S]*?)\)\s*\}/i
      );
      if (!m) return null;
      const [, , whenTrue] = m;
      const indent = src.slice(0, m.index).match(/[^\n]*$/)?.[0] ?? "";
      const replacement =
        `{\n${indent}  <ProveMembership\n${indent}    set="verified-members"\n${indent}    actionTag="login"\n` +
        `${indent}    getMemberSecret={() => /* TODO: your locally-held member credential */ "cred"}\n` +
        `${indent}  >\n${indent}    ${whenTrue.trim()}\n${indent}  </ProveMembership>\n${indent}}`;
      return {
        text: src.slice(0, m.index) + replacement + src.slice(m.index! + m[0].length),
        note: "replaced the real-name login branch with <ProveMembership> around the post-login UI",
      };
    },
  },
};
