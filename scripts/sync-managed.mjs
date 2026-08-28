// Copies each example's compiled `src/managed/` (the `compactc` output —
// contract module + zk params) into its `public/` so the browser can fetch
// the zk params at runtime. Cross-platform; safe to run before `compactc`
// (it just copies the checked-in placeholder).
//
// Wired into each example's `predev` / `prebuild`, so you never run it by
// hand. Standalone: `node scripts/sync-managed.mjs`.
import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examples = ["ecommerce-age-gate", "forum-anon-login", "pharmacy-refill"];

for (const ex of examples) {
  const src = resolve(root, "examples", ex, "src/managed");
  const dst = resolve(root, "examples", ex, "public/managed");
  if (!existsSync(src)) {
    console.log(`skip ${ex} (no src/managed yet — run compactc)`);
    continue;
  }
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
  console.log(`synced ${ex}: src/managed -> public/managed`);
}
