/** Shared numeric helpers for continuous controls. */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Map a raw value within [min,max] to a normalized [0,1] position. */
export function toNormalized(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/** Map a normalized [0,1] position back to a raw value within [min,max]. */
export function fromNormalized(t: number, min: number, max: number): number {
  return min + clamp(t, 0, 1) * (max - min);
}

/** Quantize a value to the nearest step relative to min. */
export function quantize(value: number, min: number, step: number): number {
  if (!step) return value;
  return min + Math.round((value - min) / step) * step;
}

/** Round for display so we don't render floating-point noise. */
export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
