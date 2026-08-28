// Regenerates the literal unified diffs in docs/ from the actual example
// source, so the "before/after" story in the README can never drift from
// the code. Run with: node scripts/gen-diffs.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const pairs = [
  {
    before: "examples/ecommerce-age-gate/src/App.before.tsx",
    after: "examples/ecommerce-age-gate/src/App.tsx",
    out: "docs/ecommerce.diff.txt",
  },
  {
    before: "examples/forum-anon-login/src/App.before.tsx",
    after: "examples/forum-anon-login/src/App.tsx",
    out: "docs/forum.diff.txt",
  },
];

for (const { before, after, out } of pairs) {
  let diff = "";
  try {
    // `diff` exits 1 when files differ — that's the expected path.
    execFileSync("diff", ["-u", before, after], { cwd: root });
  } catch (err) {
    diff = err.stdout?.toString() ?? "";
  }
  if (!diff) {
    console.error(`FAIL ${out}: no diff produced (are before/after identical or is 'diff' missing?)`);
    process.exit(1);
  }
  writeFileSync(resolve(root, out), diff);
  const changed = diff.split("\n").filter((l) => /^[+-][^+-]/.test(l)).length;
  console.log(`wrote ${out}  (${changed} changed lines)`);
}
