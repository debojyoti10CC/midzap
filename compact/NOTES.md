# First-compile notes for the `.compact` templates

These circuits are written to the documented Compact syntax but have **not**
been through `compactc`. This is the list of spots most likely to need a
fix on your first `compactc compile`, roughly in the order the compiler
will hit them. Fix against the messages it prints and the
`CompactStandardLibrary` your toolchain ships.

## 1. `pragma language_version 0.23;` — almost certainly wrong

The **language** version and the **compiler** version are different
schemes. Set the pragma to whatever your installed toolchain expects — run
`compactc --version` and check docs.midnight.network. A range is often
accepted: `pragma language_version >= 0.16;`. This is in all three files.

## 2. `verifySignature(...)` in `expiry_proof.compact` — likely does not exist

In-circuit signature verification is not something the Compact stdlib has
shipped historically. If `verifySignature` isn't available, restructure the
expiry proof the same way as membership: instead of checking a signature,
prove `credentialHash` is a leaf in a Merkle tree of issuer-attested
credentials (root kept in `trustedIssuers` / a new `credentialRoot`
ledger). Keep the `expiry > nowUnix` check as-is — that part is fine.

## 3. `disclose(...)` on public arguments — probably a type error

`disclose` declassifies **witness-derived** data before it goes on-chain.
These call sites pass values that are already public circuit arguments, so
`disclose` is likely rejected or warned:

- `threshold_proof.compact:40` — `verified.insert(disclose(subjectId), true)` → use `subjectId` directly.
- `expiry_proof.compact:29` — `disclose(issuerKey)` → use `issuerKey`.
- `membership_proof.compact:35` — `disclose(newRoot)` → use `newRoot`.

`membership_proof.compact:49` — `disclose(nullifier)` **is** correct;
`nullifier` derives from `secret`, which is a witness.

## 4. Merkle + hash stdlib signatures — check exact names

- `merkleTreePathRoot(proof, leaf)` (membership:45) — the helper may take
  only the path (with the leaf embedded), or be a method on a `MerkleTree`
  type. Adjust to your stdlib.
- `persistentHash<Vector<2, Bytes<32>>>([a, b])` (membership:43, 47) — the
  generic + vector-literal form may differ; some versions want
  `persistentHash([a, b])` or a specific element type.
- `MerkleTreePath<32, Bytes<32>>` (membership:32) — confirm the type name
  and arity.

## 5. `Map<_, Boolean>` used as a set — consider `Set`

`verified`, `trustedIssuers`, and `spentNullifiers` only ever store
`true`. If your stdlib has a `Set<Bytes<32>>` ledger ADT, use it:
`.insert(k)` / `.member(k)`, and drop the `Boolean` value. That also
simplifies `isVerified` (item 6).

## 6. `isVerified` — ternary and read-only circuit

`threshold_proof.compact:43-45` returns
`verified.member(x) ? verified.lookup(x) : false`. Compact may not have the
`? :` operator — use `if (…) { … } else { … }`. With a `Set` (item 5) the
whole body becomes `return verified.member(subjectId);`.

## 7. Witness names are load-bearing

The `witness` names here must match the keys in
`packages/midnightzap-sdk/src/live/witnesses.ts`:

| circuit witness | witnesses.ts key |
|---|---|
| `privateValue` | `thresholdWitnesses.privateValue` |
| `memberSecret`, `merkleProof` | `membershipWitnesses.*` |
| `issuerPublicKey`, `issuerSignature`, `credentialHash`, `expiresAtUnix` | `expiryWitnesses.*` |

If you rename a witness in the circuit, rename it there too, and update the
private-state shape in `LiveMidnightBackend`'s `SPECS`.

## 8. Circuit entrypoint names are load-bearing

`proveThreshold`, `proveMembership`, `proveCredentialValid` are referenced
by name in `LiveMidnightBackend` (`SPECS[kind].circuit`). Keep them, or
update `SPECS`.
