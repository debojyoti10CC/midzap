// PLACEHOLDER — not a real contract, and not a proof mock. Replaced by:
//   compactc compile compact/membership_proof.compact examples/forum-anon-login/src/managed/membership
// Present only so the example builds before that step. Throws if used.

class Contract {
  constructor() {
    throw new Error(
      "membership circuit is not compiled. Run:\n" +
        "  compactc compile compact/membership_proof.compact examples/forum-anon-login/src/managed/membership\n" +
        "then copy src/managed into public/. See docs/GO_LIVE.md."
    );
  }
}

module.exports = { Contract };
