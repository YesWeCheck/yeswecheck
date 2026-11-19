import type { ValidationResponse } from "./types.js";

/** `true` for `valid` and `risky`: the address will receive mail (risky = deliverable, but think twice). */
export function isDeliverable(res: ValidationResponse): boolean {
  return res.result === "valid" || res.result === "risky";
}

/**
 * The corrected address to suggest to your user ("Did you mean …?"), or `undefined`.
 * Prefers a correction the API verified as deliverable, then a detected typo.
 */
export function suggestedEmail(res: ValidationResponse): string | undefined {
  const verified = res.features.typoCorrection?.correctedEmail;
  if (verified) return verified;
  const typo = res.features.typoDomain;
  const candidate = typo?.result === "invalid" ? typo.details?.suggestedEmail : undefined;
  return typeof candidate === "string" ? candidate : undefined;
}

/** `true` when the response carries the given warning code (e.g. `DISPOSABLE_EMAIL`). */
export function hasWarning(res: ValidationResponse, code: string): boolean {
  return res.warnings?.some((w) => w.code === code) ?? false;
}
