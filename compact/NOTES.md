# Compile notes for the `.compact` templates

All three compile cleanly with `compact` toolchain **0.34.0**
(`compactc` 0.34.0). This records what was changed to get there and the
one deliberate simplification.

## What the first compile required

1. **`pragma language_version 0.26.0;`** — the toolchain rejected `0.23`
   with `language version 0.26.0 mismatch`. The *compiler* is 0.34.x; the
   *language* pragma it wants is `0.26.0`.

2. **`const` on every local binding.** `value = expr;` is an unbound
   identifier — Compact 0.26 needs `const value = expr;`.

3. **`disclose()` on ledger-key arguments.** The disclosure analysis flags
   any circuit parameter used as a `Map`/`Set` key as a potential witness
   leak and *requires* `disclose(...)` around it — even for values that are
   already public circuit arguments (`subjectId`, credential hash, member
   commitment). So `disclose` here is mandatory, not forbidden.

## The membership / expiry simplification (v1)

`merkleTreePathRoot<#n, T>(path: MerkleTreePath<n, T>): MerkleTreeDigest`
exists, and a fully-anonymous version is possible with it. To keep this
milestone shippable, v1 uses a simpler on-chain structure instead:

- **membership** — member *commitments* (`persistentHash(["member:", secret])`)
  live in an on-chain `Set<Bytes<32>>`; the proof asserts
  `members.member(disclose(commitment))`. This is **pseudonymous**: the
  commitment (a hash, never a name) is revealed, so repeat actions by one
  member are linkable. The per-action nullifier still prevents double-acting.

- **expiry** — the issuer registers `credentialHash -> expiry` in an
  on-chain `Map`; the proof reveals the hash and asserts the recorded
  expiry is in the future. In-circuit signature verification
  (`verifySignature`) is not in the stdlib, so the "trusted issuer" check
  is "the issuer put this hash in the registry".

### Upgrading to fully anonymous

Replace the `Set` / `Map` with a Merkle tree whose root is the only
on-chain state, add `witness merkleProof(): MerkleTreePath<n, Bytes<32>>`,
and assert `merkleTreePathRoot<n, Bytes<32>>(merkleProof()) == root`
without disclosing the leaf. Then:

- add the path back to `MembershipPrivateState` / `ExpiryPrivateState` in
  `packages/midnightzap-sdk/src/live/witnesses.ts`,
- have `<ProveMembership getExtraWitness={() => ({ merklePath })} />` /
  `<ProveCredentialValid getExtraWitness={() => ({ merklePath })} />` fetch
  the path from the set/registry operator's tree service,
- update `SPECS[...].toPrivateState` in `liveBackend.ts`.

## Load-bearing names

`liveBackend.ts` references circuits and witnesses by name — keep these in
sync if you edit a template:

| circuit | entrypoint(s) | witness(es) |
|---|---|---|
| threshold | `proveThreshold`, `isVerified` | `privateValue` |
| membership | `proveMembership`, `addMember` | `memberSecret` |
| expiry | `proveCredentialValid`, `registerCredential` | `credentialHash` |

## Recompiling

```
compact compile compact/threshold_proof.compact   examples/ecommerce-age-gate/src/managed/threshold
compact compile compact/membership_proof.compact  examples/forum-anon-login/src/managed/membership
compact compile compact/expiry_proof.compact      examples/pharmacy-refill/src/managed/expiry
```

The output (`contract/index.js`, `keys/`, `zkir/`) is checked in so the
repo runs without the toolchain. `sync-managed.mjs` copies it into each
example's `public/` on `predev` / `prebuild`.
