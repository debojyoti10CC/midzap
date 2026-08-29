// Copies the compiled Compact circuits from the example workspaces into
// recipes/managed/ so the published @midzap/cli package ships them.
// In the monorepo the CLI reads them straight from examples/ instead, so
// this only matters for `npm publish` (wired as prepublishOnly).
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(pkg, "..", "..");
const map = {
  threshold: "examples/ecommerce-age-gate/src/managed/threshold",
  membership: "examples/forum-anon-login/src/managed/membership",
  expiry: "examples/pharmacy-refill/src/managed/expiry",
};

for (const [name, rel] of Object.entries(map)) {
  const src = join(repo, rel);
  if (!existsSync(join(src, "contract", "index.js"))) {
    console.error(`missing compiled circuit: ${rel} — run \`compact compile\` first`);
    process.exit(1);
  }
  const dst = join(pkg, "recipes", "managed", name);
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { recursive: true });
  console.log(`synced ${name}`);
}
