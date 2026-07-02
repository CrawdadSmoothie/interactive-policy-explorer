import type { PolicyArea } from "./types";

export type InputValues = Record<string, number>;
export type OutputSeries = Record<string, number[]>;

/**
 * Default input values for an area (used for the baseline reference series).
 */
export function defaultInputs(area: PolicyArea): InputValues {
  const values: InputValues = {};
  for (const input of area.inputs) values[input.id] = input.default;
  return values;
}

/**
 * Per-input multiplier relative to its default: (value / default) ^ exponent.
 * Returns 1 when the default is 0 (no meaningful ratio) or the input is absent.
 */
function inputMultiplier(
  area: PolicyArea,
  inputId: string,
  exponent: number,
  values: InputValues,
): number {
  const def = area.inputs.find((i) => i.id === inputId);
  if (!def || def.default === 0) return 1;
  const value = values[inputId] ?? def.default;
  const ratio = value / def.default;
  if (ratio < 0) return 0;
  return Math.pow(ratio, exponent);
}

/**
 * Illustrative, spreadsheet-style multiplier model:
 *   output(t) = baseline(t) * Π over drivers (value/default)^exponent
 *
 * Baselines are evaluated at default inputs, so default inputs reproduce the
 * source series exactly. This is intentionally simple and config-driven; the
 * real methodology can be swapped per-metric without touching the UI.
 */
export function computeOutputs(area: PolicyArea, values: InputValues): OutputSeries {
  const result: OutputSeries = {};
  for (const metric of area.metrics) {
    let multiplier = 1;
    for (const [inputId, exponent] of Object.entries(metric.drivers)) {
      multiplier *= inputMultiplier(area, inputId, exponent, values);
    }
    const baseline = area.baselines[metric.id] ?? [];
    result[metric.id] = baseline.map((b) => b * multiplier);
  }
  return result;
}

/** Value of a metric series at the final time point (long-run impact). */
export function longRunValue(series: number[]): number {
  return series.length ? series[series.length - 1] : 0;
}

/** Cumulative sum across the series (rough lifetime total). */
export function cumulative(series: number[]): number {
  return series.reduce((sum, v) => sum + v, 0);
}
