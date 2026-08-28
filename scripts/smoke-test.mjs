// Headless sanity check for the InMemoryProofBackend: proves the exact logic
// that the Compact circuits in /compact enforce actually behaves right,
// independent of any UI. Run with: node scripts/smoke-test.mjs
import { MidnightZapClient, InMemoryProofBackend } from "../packages/midnightzap-sdk/dist/index.js";

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    console.error(`  FAIL ${name}`);
    failures++;
  }
}

async function main() {
  console.log("threshold predicate (age >= 21):");
  {
    const client = new MidnightZapClient({ backend: new InMemoryProofBackend({ artificialDelayMs: 0 }) });
    const adult = await client.prove(
      { kind: "threshold", field: "age", threshold: 21 },
      "subject-a",
      { value: 30 }
    );
    check("30 >= 21 verifies", adult.verified === true && !!adult.receipt);

    const minor = await client.prove(
      { kind: "threshold", field: "age", threshold: 21 },
      "subject-b",
      { value: 17 }
    );
    check("17 >= 21 is rejected", minor.verified === false && !!minor.error);

    check("verified receipt is an opaque 32-char hex digest", /^[0-9a-f]{32}$/.test(adult.receipt ?? ""));
    check("rejected result carries no receipt", minor.receipt === undefined);

    const missing = await client.prove(
      { kind: "threshold", field: "age", threshold: 21 },
      "subject-b2",
      {}
    );
    check("missing private value is rejected, not thrown", missing.verified === false && !!missing.error);
  }

  console.log("membership predicate (anti-replay nullifier):");
  {
    const client = new MidnightZapClient({ backend: new InMemoryProofBackend({ artificialDelayMs: 0 }) });
    const first = await client.prove(
      { kind: "membership", set: "verified-employees", actionTag: "post-access" },
      "subject-c",
      { memberSecret: "cred-123" }
    );
    check("first membership proof for a credential verifies", first.verified === true);

    const replay = await client.prove(
      { kind: "membership", set: "verified-employees", actionTag: "post-access" },
      "subject-c",
      { memberSecret: "cred-123" }
    );
    check("replaying the same credential for the same action is rejected", replay.verified === false);

    const differentAction = await client.prove(
      { kind: "membership", set: "verified-employees", actionTag: "vote:proposal-1" },
      "subject-c",
      { memberSecret: "cred-123" }
    );
    check("same credential works for a different action tag", differentAction.verified === true);
  }

  console.log("credential-valid predicate (expiry):");
  {
    const client = new MidnightZapClient({ backend: new InMemoryProofBackend({ artificialDelayMs: 0 }) });
    const future = Math.floor(Date.now() / 1000) + 3600;
    const past = Math.floor(Date.now() / 1000) - 3600;

    const valid = await client.prove(
      { kind: "credential-valid", issuer: "pharmacy-board" },
      "subject-d",
      { expiresAtUnix: future }
    );
    check("unexpired credential verifies", valid.verified === true);

    const expired = await client.prove(
      { kind: "credential-valid", issuer: "pharmacy-board" },
      "subject-e",
      { expiresAtUnix: past }
    );
    check("expired credential is rejected", expired.verified === false);
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
