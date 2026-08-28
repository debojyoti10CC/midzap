// End-to-end check for @midnightzap/cli.
//
// Runs `midnightzap add age-gate` against the pristine `examples/plain-shop`
// workspace in place, asserts the codemod output, typechecks + builds the
// result, then restores plain-shop with git. Proves the CLI produces a
// compiling Midnight app.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages/midnightzap-cli/dist/cli.js");
const app = join(root, "examples/plain-shop");
const sh = process.platform === "win32";

if (!existsSync(cli)) fail("build the CLI first (npm run build --workspace=@midnightzap/cli)");

let dirty = false;
try {
  run("node", [cli, "add", "age-gate", app, "--yes"]);
  dirty = true;

  const appTsx = readFileSync(join(app, "src/App.tsx"), "utf8");
  ok(appTsx.includes("<ProveThreshold"), "App.tsx uses <ProveThreshold>");
  ok(!appTsx.includes('type="checkbox"'), "the self-reported checkbox is gone");
  ok(existsSync(join(app, "src/midnight.ts")), "src/midnight.ts generated");
  ok(
    existsSync(join(app, "src/managed/threshold/contract/index.js")),
    "compiled threshold circuit copied in"
  );
  ok(
    readFileSync(join(app, "src/main.tsx"), "utf8").includes("<MidnightZapProvider"),
    "main.tsx wrapped in <MidnightZapProvider>"
  );
  ok(
    /@midnight-?ntwrk/.test(readFileSync(join(app, "vite.config.ts"), "utf8")),
    "vite.config.ts patched for the Midnight runtime"
  );

  run("npm", ["run", "typecheck", "--workspace=plain-shop"]);
  run("npm", ["run", "build", "--workspace=plain-shop"]);
  console.log("\n✓ CLI e2e: plain-shop converts, typechecks, and builds.");
} finally {
  if (dirty) {
    execFileSync("git", ["checkout", "--", "examples/plain-shop"], { cwd: root, shell: sh });
    execFileSync("git", ["clean", "-fdq", "examples/plain-shop"], { cwd: root, shell: sh });
  }
}

function run(cmd, args) {
  execFileSync(cmd, args, { cwd: root, stdio: "inherit", shell: sh });
}
function ok(cond, msg) {
  if (!cond) fail(msg);
  console.log(`  ok   ${msg}`);
}
function fail(msg) {
  console.error(`  FAIL ${msg}`);
  process.exit(1);
}
