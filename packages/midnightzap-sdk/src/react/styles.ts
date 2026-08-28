import type { CSSProperties } from "react";

/**
 * Zero-config default styling for the drop-in components.
 *
 * These are inline styles so a MidnightZap component looks finished the
 * moment it's pasted in — no stylesheet import, no build step, no CSS
 * framework assumptions. Every colour is driven by a CSS custom property
 * with a sensible fallback, so a host app can theme the whole SDK by
 * setting a few variables on a parent element:
 *
 *   :root {
 *     --mz-accent: #6d28d9;
 *     --mz-radius: 10px;
 *   }
 *
 * Prefer full control? Pass `unstyled` to any component and style the
 * stable class names / `[data-status]` attribute yourself.
 */

export const cssVars = {
  accent: "var(--mz-accent, #16213e)",
  accentText: "var(--mz-accent-text, #ffffff)",
  ok: "var(--mz-ok, #0a7f43)",
  error: "var(--mz-error, #b3261e)",
  radius: "var(--mz-radius, 8px)",
  font: "var(--mz-font, inherit)",
} as const;

export const styles: Record<string, CSSProperties> = {
  root: {
    display: "inline-flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-start",
    fontFamily: cssVars.font,
  },
  button: {
    appearance: "none",
    border: "none",
    background: cssVars.accent,
    color: cssVars.accentText,
    padding: "10px 18px",
    borderRadius: cssVars.radius,
    fontSize: 15,
    fontFamily: "inherit",
    lineHeight: 1.2,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "opacity 120ms ease",
  },
  buttonBusy: {
    opacity: 0.7,
    cursor: "progress",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  spinner: {
    width: 13,
    height: 13,
    borderRadius: "50%",
    border: "2px solid currentColor",
    borderTopColor: "transparent",
    animation: "mz-spin 700ms linear infinite",
    display: "inline-block",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: cssVars.ok,
    fontWeight: 600,
    fontSize: 14,
  },
  error: {
    color: cssVars.error,
    fontSize: 13,
    margin: 0,
  },
  retry: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: cssVars.accent,
    padding: 0,
    fontSize: 13,
    fontFamily: "inherit",
    textDecoration: "underline",
    cursor: "pointer",
  },
};

/** Keyframes for the busy spinner — injected once, browser-only. */
let injected = false;
export function ensureKeyframes(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const el = document.createElement("style");
  el.dataset.midnightzap = "keyframes";
  el.textContent = "@keyframes mz-spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(el);
}

export function merge(
  unstyled: boolean | undefined,
  base: CSSProperties,
  override?: CSSProperties
): CSSProperties | undefined {
  if (unstyled) return override;
  return { ...base, ...override };
}
