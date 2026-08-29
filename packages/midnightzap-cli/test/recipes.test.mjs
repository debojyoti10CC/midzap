import { test } from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../dist/recipes.js";
import { ensureImport, ensureProvider } from "../dist/project.js";

const age = RECIPES["age-gate"];
const cred = RECIPES["credential-check"];
const anon = RECIPES["anon-login"];

test("age-gate: checkbox → <ProveThreshold>, guard dropped", () => {
  const src = `
export function App() {
  const [ok, setOk] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <div>
      <label><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I am 21+</label>
      <button disabled={!ok || done} onClick={() => setDone(true)}>Buy</button>
    </div>
  );
}`;
  const out = age.apply(src);
  assert.ok(out, "recipe matched");
  assert.match(out.text, /<ProveThreshold/);
  assert.match(out.text, /<\/ProveThreshold>/);
  assert.doesNotMatch(out.text, /type="checkbox"/);
  assert.match(out.text, /disabled=\{done\}/, "!ok removed from the guard");
});

test("age-gate: no match on an app with no checkbox", () => {
  assert.equal(age.apply(`export const App = () => <button>Buy</button>;`), null);
});

test("credential-check: file input → <ProveCredentialValid>", () => {
  const src = `
export function App() {
  const [file, setFile] = useState(null);
  return (
    <>
      <label>Upload: <input type="file" onChange={(e) => setFile(e.target.files[0])} /></label>
      <button disabled={!file}>Submit</button>
    </>
  );
}`;
  const out = cred.apply(src);
  assert.ok(out);
  assert.match(out.text, /<ProveCredentialValid/);
  assert.doesNotMatch(out.text, /type="file"/);
});

test("anon-login: login branch → <ProveMembership>", () => {
  const src = `
export function App() {
  const [in, setIn] = useState(false);
  return (
    <div>
      { in ? (
        <Composer />
      ) : (
        <button onClick={() => setIn(true)}>Log in with SSO</button>
      )}
    </div>
  );
}`;
  const out = anon.apply(src);
  assert.ok(out);
  assert.match(out.text, /<ProveMembership/);
  assert.match(out.text, /<Composer \/>/);
});

test("ensureImport merges into an existing import", () => {
  const src = `import { MidnightZapProvider } from "@midzap/sdk/react";\nconst x = 1;`;
  const out = ensureImport(src, "@midzap/sdk/react", ["ProveThreshold"]);
  assert.match(out, /import \{ MidnightZapProvider, ProveThreshold \} from "@midzap\/sdk\/react";/);
});

test("ensureProvider wraps a createRoot render and is idempotent", () => {
  const src = `import ReactDOM from "react-dom/client";\nReactDOM.createRoot(el).render(<App />);\n`;
  const once = ensureProvider(src, `backend={backend}`);
  assert.ok(once.wrapped);
  assert.match(once.text, /<MidnightZapProvider backend=\{backend\}>/);
  const twice = ensureProvider(once.text, `backend={backend}`);
  assert.equal(twice.wrapped, false, "second pass is a no-op");
});
