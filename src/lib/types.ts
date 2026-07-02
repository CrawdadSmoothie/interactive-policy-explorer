import { z } from "zod";

/**
 * How a numeric value should be formatted for display.
 * The stored values stay in the spreadsheet's native units; formatters
 * (see lib/format.ts) handle any unit scaling for presentation.
 */
export const metricFormatSchema = z.enum([
  "people_k", // value is in thousands of people
  "percent", // value is a fraction 0..1
  "currency", // value is whole dollars
  "currency_m", // value is in millions of dollars
  "number", // plain count
]);
export type MetricFormat = z.infer<typeof metricFormatSchema>;

export const directionSchema = z.enum(["up-good", "down-good", "neutral"]);
export type Direction = z.infer<typeof directionSchema>;

/** An adjustable input. The dataset may carry 1..N of these per area. */
export const inputDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  unit: z.string(),
  format: metricFormatSchema,
  min: z.number(),
  max: z.number(),
  step: z.number(),
  default: z.number(),
  /** Marks an input that exists in the model but is not yet confirmed/shown. */
  optional: z.boolean().optional(),
});
export type InputDef = z.infer<typeof inputDefSchema>;

/** A computed output series. */
export const metricDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  shortLabel: z.string().optional(),
  unit: z.string(),
  format: metricFormatSchema,
  direction: directionSchema.default("neutral"),
  /**
   * Which inputs drive this metric, and with what exponent.
   * Default (illustrative) model: output = baseline * Π (value/default)^exponent.
   * An exponent of 0 (or an omitted input) means the input has no effect.
   */
  drivers: z.record(z.string(), z.number()),
});
export type MetricDef = z.infer<typeof metricDefSchema>;

export const policyAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Optional short subtitle; prototype merges this into `summary`. */
  tagline: z.string().optional(),
  /** One concise sentence describing the policy, shown in the area header. */
  summary: z.string(),
  /** Viz palette token to theme this area: "viz-1".."viz-5". */
  accentToken: z.string(),
  inputs: z.array(inputDefSchema).min(1),
  metrics: z.array(metricDefSchema).min(1),
  /** metricId -> series aligned to dataset.timeAxis, evaluated at default inputs. */
  baselines: z.record(z.string(), z.array(z.number())),
  primaryMetricId: z.string(),
  highlightMetricIds: z.array(z.string()),
});
export type PolicyArea = z.infer<typeof policyAreaSchema>;

export const policyDatasetSchema = z.object({
  meta: z.object({
    version: z.string(),
    dataQuality: z.enum(["illustrative", "source"]),
    source: z.string(),
    generatedAt: z.string(),
    disclaimer: z.string(),
  }),
  timeAxis: z.array(z.number()),
  areas: z.array(policyAreaSchema).min(1),
});
export type PolicyDataset = z.infer<typeof policyDatasetSchema>;
