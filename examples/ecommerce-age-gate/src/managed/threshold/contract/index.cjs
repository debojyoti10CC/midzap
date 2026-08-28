// PLACEHOLDER — not a real contract, and not a proof mock.
//
// Replaced in full by:
//   compactc compile compact/threshold_proof.compact \
//     examples/ecommerce-age-gate/src/managed/threshold
//
// It exists only so the example builds before that one-time step. Any
// attempt to actually use it throws.

class Contract {
  constructor() {
    throw new Error(
      "threshold circuit is not compiled. Run:\n" +
        "  compactc compile compact/threshold_proof.compact examples/ecommerce-age-gate/src/managed/threshold\n" +
        "then copy src/managed into public/. See docs/GO_LIVE.md."
    );
  }
}

module.exports = { Contract };
