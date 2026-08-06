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
 * Illustrative, spreadsheet-style model:
 *   output(t) = baseline(t) * Π (value/default)^exponent
 *               + Σ offsets[input] * value * year(t)
 *
 * The first term scales the source series proportionally. The second is for
 * inputs that accumulate in absolute terms rather than scaling the curve --
 * an annual cost, for instance, has been paid `year(t)` times by time t, so it
 * subtracts a growing amount from the gross federal budget gain.
 *
 * Baselines are evaluated at default inputs, so leaving every input at its
 * default reproduces the source series exactly (offsets included, since they
 * are folded into the baseline by the converter). This stays intentionally
 * simple and config-driven; the real methodology can be swapped per-metric
 * without touching the UI.
 */
export function computeOutputs(
  area: PolicyArea,
  values: InputValues,
  years: number[],
): OutputSeries {
  const result: OutputSeries = {};
  for (const metric of area.metrics) {
    let multiplier = 1;
    for (const [inputId, exponent] of Object.entries(metric.drivers)) {
      multiplier *= inputMultiplier(area, inputId, exponent, values);
    }

    const baseline = area.baselines[metric.id] ?? [];
    result[metric.id] = baseline.map(
      (b, i) => b * multiplier + offsetAt(area, metric.offsets, values, years[i] ?? 0),
    );
  }
  return result;
}

/**
 * Additive contribution at a single point in time. Measured relative to each
 * input's default so that the baseline series -- which already reflects the
 * defaults -- is not double-counted.
 */
function offsetAt(
  area: PolicyArea,
  offsets: Record<string, number> | undefined,
  values: InputValues,
  year: number,
): number {
  if (!offsets) return 0;
  let total = 0;
  for (const [inputId, coefficient] of Object.entries(offsets)) {
    const def = area.inputs.find((i) => i.id === inputId);
    if (!def) continue;
    const delta = (values[inputId] ?? def.default) - def.default;
    total += coefficient * delta * year;
  }
  return total;
}

/** Value of a metric series at the final time point (long-run impact). */
export function longRunValue(series: number[]): number {
  return series.length ? series[series.length - 1] : 0;
}

/** Value at a specific time index, falling back to the final point. */
export function valueAt(series: number[], index: number | null): number {
  if (index == null || index < 0 || index >= series.length) {
    return longRunValue(series);
  }
  return series[index];
}

/**
 * Number of time points within a horizon, given the dataset's year axis.
 * The axis is sparse past year 10 ([1..10, 20, 30]), so this counts points
 * rather than assuming a fixed stride.
 */
export function horizonLength(years: number[], horizon: number): number {
  const count = years.filter((y) => y <= horizon).length;
  return count > 0 ? count : years.length;
}

/** Cumulative sum across the series (rough lifetime total). */
export function cumulative(series: number[]): number {
  return series.reduce((sum, v) => sum + v, 0);
}
