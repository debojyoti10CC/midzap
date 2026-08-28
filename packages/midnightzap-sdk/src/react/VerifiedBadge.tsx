import React from "react";

export interface VerifiedBadgeProps {
  verified: boolean;
  label?: string;
}

/** A tiny presentational badge — handy when composing custom flows with the render-prop APIs. */
export function VerifiedBadge({ verified, label = "Verified privately" }: VerifiedBadgeProps) {
  if (!verified) return null;
  return <span className="midnightzap-verified-badge">&#10003; {label}</span>;
}
