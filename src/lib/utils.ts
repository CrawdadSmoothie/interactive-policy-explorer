export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Maps a dataset accent token ("viz-1".."viz-5") to its CSS variable. */
export function accentVar(token: string): string {
  return `var(--${token})`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Percent change of a value vs a baseline, guarding divide-by-zero. */
export function pctChange(value: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return (value - baseline) / Math.abs(baseline);
}
