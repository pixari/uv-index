// Pure, no browser/Node dependency — shared between the client's
// foreground alert (HomeClient) and the server-side push scheduler
// (src/lib/pushScheduler.ts), so "when do we actually alert someone"
// is defined exactly once instead of two implementations quietly
// drifting apart.

export const HIGH_UV_THRESHOLD = 7;

/**
 * True only on the rising edge — the moment a reading first reaches the
 * threshold, not on every reading that happens to still be at or above
 * it. A `prevUv` of `null` (nothing seen yet this session/subscription)
 * counts as "was below", so a first reading that's already high still
 * fires once.
 */
export function crossedHighUvThreshold(
  prevUv: number | null,
  nextUv: number,
  threshold: number = HIGH_UV_THRESHOLD,
): boolean {
  return nextUv >= threshold && (prevUv === null || prevUv < threshold);
}
