/**
 * Global number formatting standard: space-grouped thousands, comma decimal
 * (European convention) — every raw number shown to the player should go
 * through this, regardless of active UI language. `toLocaleString("pt-PT")`
 * groups with U+00A0 NBSP; normalized to a plain space here so it matches
 * the pixel font stack and copy/pastes cleanly.
 *
 * `useGrouping` is forced on: pt-PT's default ("auto") skips grouping for
 * 4-digit numbers specifically (8611 -> "8611", not "8 611"), which is the
 * exact inconsistency this utility exists to close.
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString("pt-PT", { useGrouping: true, ...options }).replace(/ /g, " ");
}
