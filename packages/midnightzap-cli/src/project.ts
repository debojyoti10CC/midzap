import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fail, warn } from "./util.js";

export interface ProjectInfo {
  root: string;
  pkgPath: string;
  pkg: Record<string, any>;
  /** File that renders the app root — where <MidnightZapProvider> goes. */
  rootFile: string;
}

const ROOT_CANDIDATES = [
  "src/main.tsx",
  "src/main.jsx",
  "src/index.tsx",
  "src/App.tsx",
  "src/app.tsx",
  "pages/_app.tsx",
  "src/pages/_app.tsx",
];

export function loadProject(dir: string): ProjectInfo {
  const root = resolve(dir);
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) fail(`No package.json in ${root}. Point me at a project directory.`);
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  if (!deps.react) warn("No `react` dependency found — proceeding, but this recipe targets React apps.");

  const rootFile = ROOT_CANDIDATES.map((p) => join(root, p)).find(existsSync);
  if (!rootFile) fail(`Couldn't find an app entry. Tried: ${ROOT_CANDIDATES.join(", ")}`);

  return { root, pkgPath, pkg, rootFile: rootFile! };
}

export function addDependency(pkg: Record<string, any>, name: string, version: string): boolean {
  pkg.dependencies ??= {};
  if (pkg.dependencies[name]) return false;
  pkg.dependencies[name] = version;
  return true;
}

/** Add named imports from `mod`, merging into an existing import if present. */
export function ensureImport(src: string, mod: string, names: string[]): string {
  const re = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${mod.replace(/[/\\]/g, "\\$&")}["'];?`);
  const existing = src.match(re);
  if (existing) {
    const have = existing[1].split(",").map((s) => s.trim()).filter(Boolean);
    const merged = Array.from(new Set([...have, ...names]));
    return src.replace(re, `import { ${merged.join(", ")} } from "${mod}";`);
  }
  const line = `import { ${names.join(", ")} } from "${mod}";`;
  const lastImport = [...src.matchAll(/^import .*$/gm)].pop();
  if (lastImport) {
    const at = lastImport.index! + lastImport[0].length;
    return src.slice(0, at) + "\n" + line + src.slice(at);
  }
  return line + "\n" + src;
}

/** Wrap the app root render in <MidnightZapProvider …>. Idempotent. */
export function ensureProvider(src: string, providerProps: string): { text: string; wrapped: boolean } {
  if (src.includes("<MidnightZapProvider")) return { text: src, wrapped: false };
  let out = ensureImport(src, "@midzap/sdk/react", ["MidnightZapProvider"]);
  out = ensureImport(out, "./midnight.js", ["contracts", "backend"]);

  // createRoot(...).render(<App />)
  const render = out.match(/\.render\(\s*(<[\s\S]*?>)\s*\)/);
  if (render) {
    const inner = render[1]
      .trim()
      .split("\n")
      .map((l, i) => {
        if (i === 0) return l.trim();
        const t = l.trim();
        return (t.startsWith("</") ? "      " : "        ") + t;
      })
      .join("\n");
    return {
      text: out.replace(
        render[0],
        `.render(\n    <MidnightZapProvider ${providerProps}>\n      ${inner}\n    </MidnightZapProvider>,\n  )`
      ),
      wrapped: true,
    };
  }
  // export function App() { return ( <…/> ) }
  const ret = out.match(/return\s*\(\s*([\s\S]*?)\s*\);\s*\n\}/);
  if (ret) {
    return {
      text: out.replace(
        ret[0],
        `return (\n    <MidnightZapProvider ${providerProps}>\n      ${ret[1].trim()}\n    </MidnightZapProvider>\n  );\n}`
      ),
      wrapped: true,
    };
  }
  warn("Couldn't auto-wrap <MidnightZapProvider>. Add it around your app root by hand.");
  return { text: out, wrapped: false };
}

export function save(path: string, text: string) {
  writeFileSync(path, text);
}
export function savePkg(info: ProjectInfo) {
  writeFileSync(info.pkgPath, JSON.stringify(info.pkg, null, 2) + "\n");
}
