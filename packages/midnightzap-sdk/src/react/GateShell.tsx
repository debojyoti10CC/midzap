import React, { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ProofStatus } from "../core/types.js";
import type { UseProofState } from "./useProof.js";
import { styles, merge, ensureKeyframes } from "./styles.js";

/** State handed to a `render` prop: the proof state, with `run` as a no-arg trigger. */
export type GateRenderState = Omit<UseProofState, "run" | "retry"> & {
  /** Start (or restart) the proof. The private-value getter is already wired in. */
  run: () => void;
};

/** Presentational props every drop-in predicate component accepts. */
export interface GatePresentationProps {
  /** Extra class on the wrapper (default class name is always present too). */
  className?: string;
  /** Inline style merged onto (or, with `unstyled`, replacing) the wrapper. */
  style?: CSSProperties;
  /** Drop all default inline styling; keep the stable class names + data-status. */
  unstyled?: boolean;
  /** Override the idle trigger button text. */
  buttonLabel?: ReactNode;
  /** Force the trigger disabled (e.g. a form isn't ready yet). */
  disabled?: boolean;
  /**
   * Content revealed once the proof is verified. This is the common case:
   * put the thing you're gating here and skip the manual `useState`.
   */
  children?: ReactNode;
  /** Shown above the trigger before verification — a prompt, a note. */
  whileLocked?: ReactNode;
  /**
   * Full manual control. Gets the proof state plus a `run` trigger (call
   * it with no args — the getter wiring is already done); return whatever
   * UI you want. Overrides the default button and `children`.
   */
  render?: (state: GateRenderState) => ReactNode;
}

interface GateShellProps extends GatePresentationProps {
  proof: UseProofState;
  trigger: () => void;
  wrapperClass: string;
  idleLabel: string;
  verifiedLabel: string;
}

const BUSY_LABEL: Partial<Record<ProofStatus, string>> = {
  "connecting-wallet": "Connecting wallet…",
  "generating-proof": "Generating zero-knowledge proof…",
  submitting: "Submitting…",
};

export function GateShell({
  proof,
  trigger,
  wrapperClass,
  idleLabel,
  verifiedLabel,
  className,
  style,
  unstyled,
  buttonLabel,
  disabled,
  children,
  whileLocked,
  render,
}: GateShellProps) {
  useEffect(() => {
    if (!unstyled) ensureKeyframes();
  }, [unstyled]);

  const cls = [wrapperClass, className].filter(Boolean).join(" ");

  if (render) {
    return (
      <div className={cls} data-status={proof.status} style={merge(unstyled, styles.root, style)}>
        {render({ ...proof, run: trigger })}
      </div>
    );
  }

  if (proof.verified && children != null) {
    // Gated content is the host app's own UI — don't impose layout on it,
    // just keep the class name + status hook for styling.
    return (
      <div className={cls} data-status="verified" style={style}>
        {children}
      </div>
    );
  }

  return (
    <div className={cls} data-status={proof.status} style={merge(unstyled, styles.root, style)}>
      {!proof.verified && whileLocked}

      {!proof.verified && (
        <button
          type="button"
          className={`${wrapperClass}__button`}
          onClick={trigger}
          disabled={disabled || proof.busy}
          style={merge(
            unstyled,
            {
              ...styles.button,
              ...(proof.busy ? styles.buttonBusy : null),
              ...(disabled ? styles.buttonDisabled : null),
            }
          )}
        >
          {proof.busy && <span style={unstyled ? undefined : styles.spinner} aria-hidden />}
          {proof.busy
            ? BUSY_LABEL[proof.status] ?? "Working…"
            : buttonLabel ?? (proof.status === "rejected" || proof.status === "error"
                ? "Try again"
                : idleLabel)}
        </button>
      )}

      {proof.verified && (
        <span className={`${wrapperClass}__badge midnightzap-verified-badge`} style={unstyled ? undefined : styles.badge}>
          <span aria-hidden>✓</span> {verifiedLabel}
        </span>
      )}

      {proof.error && (
        <p className={`${wrapperClass}__error midnightzap-error`} style={unstyled ? undefined : styles.error} role="alert">
          {proof.error}
        </p>
      )}
    </div>
  );
}
