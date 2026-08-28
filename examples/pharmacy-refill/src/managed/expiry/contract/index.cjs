// PLACEHOLDER — not a real contract, and not a proof mock. Replaced by:
//   compactc compile compact/expiry_proof.compact examples/pharmacy-refill/src/managed/expiry
// Present only so the example builds before that step. Throws if used.

class Contract {
  constructor() {
    throw new Error(
      "expiry circuit is not compiled. Run:\n" +
        "  compactc compile compact/expiry_proof.compact examples/pharmacy-refill/src/managed/expiry\n" +
        "then copy src/managed into public/. See docs/GO_LIVE.md."
    );
  }
}

module.exports = { Contract };
