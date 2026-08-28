import React from "react";
import type { CSSProperties } from "react";
import { styles } from "./styles.js";

export interface VerifiedBadgeProps {
  verified: boolean;
  label?: string;
  unstyled?: boolean;
  style?: CSSProperties;
}

/** A tiny presentational badge — handy when composing custom flows with the `render` prop. */
export function VerifiedBadge({ verified, label = "Verified privately", unstyled, style }: VerifiedBadgeProps) {
  if (!verified) return null;
  return (
    <span
      className="midnightzap-verified-badge"
      style={unstyled ? style : { ...styles.badge, ...style }}
    >
      <span aria-hidden>✓</span> {label}
    </span>
  );
}
