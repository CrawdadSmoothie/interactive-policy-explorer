/**
 * xlsx -> policies.json converter.
 *
 * Reads the source workbook for the canonical policy-area names, parameter
 * labels, and magnitude anchors, then emits a typed, Zod-validated dataset at
 * src/data/policies.json.
 *
 * IMPORTANT: the sample workbook only populates one area with flat values, so
 * for the PROTOTYPE this script synthesizes illustrative, time-shaped baselines
 * (clearly flagged dataQuality: "illustrative"). When a complete workbook with
 * real per-year series for every area arrives, extend `readAreaSeries` to read
 * those rows directly and set dataQuality to "source" -- no UI changes needed.
 *
 * Run: npm run data
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { policyDatasetSchema, type PolicyArea } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = process.argv[2] ?? resolve(ROOT, "data/source/example-spreadsheet.xlsx");
const OUT = resolve(ROOT, "src/data/policies.json");

const TIME_AXIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30];

/** Index of year 10 -- the federal budget scoring window. */
const TEN_YEAR_INDEX = TIME_AXIS.indexOf(10);

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// --- Parse the workbook into rows ------------------------------------------

type Grid = (string | number | null)[][];

function readGrid(path: string): Grid {
  const wb = XLSX.read(readFileSync(path), { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });
}

/**
 * Walk the grid collecting, per area (col A), the parameter rows (col B label +
 * year values in cols C..). Returns area order and a label->values map.
 */
function parseAreas(grid: Grid) {
  const areas: { name: string; params: Map<string, number[]> }[] = [];
  let current: { name: string; params: Map<string, number[]> } | null = null;

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const areaName = (row[0] ?? "").toString().trim();
    const paramLabel = (row[1] ?? "").toString().trim();

    if (areaName) {
      current = { name: areaName, params: new Map() };
      areas.push(current);
    }
    if (current && paramLabel) {
      const values = row
        .slice(2)
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((v) => Number.isFinite(v)) as number[];
      current.params.set(paramLabel, values);
    }
  }
  return areas;
}

// --- Metric definitions (canonical) ----------------------------------------

// `drivers` are illustrative input sensitivities (exponents) so that metrics
// respond differently to Reach vs Effectiveness. Swap with the real model later.
// `unit` labels are symbol-free nouns; the formatter already renders %, $, etc.
const METRICS = [
  { id: "mhPrevalence", match: "mh prevalence", label: "Change in MH Prevalence", shortLabel: "MH prevalence", unit: "cases", format: "number", direction: "down-good", drivers: { reach: 1, effectiveness: 1 } },
  { id: "laborSupply", match: "labor supply", label: "Change in Labor Supply", shortLabel: "Labor supply", unit: "people", format: "people_k", direction: "up-good", drivers: { reach: 1, effectiveness: 0.8 } },
  { id: "laborProductivity", match: "labor productivity", label: "Change in Labor Productivity", shortLabel: "Productivity", unit: "per hour", format: "currency", direction: "up-good", drivers: { reach: 0.2, effectiveness: 0.9 } },
  { id: "savings", match: "savings", label: "Change in Savings", shortLabel: "Savings", unit: "", format: "currency", direction: "up-good", drivers: { reach: 0.9, effectiveness: 0.9 } },
  { id: "gdp", match: "gdp", label: "Change in GDP", shortLabel: "GDP", unit: "", format: "currency_m", direction: "up-good", drivers: { reach: 1, effectiveness: 1 } },
  { id: "medicaidSpending", match: "medicaid", label: "Change in Medicaid Spending", shortLabel: "Medicaid", unit: "", format: "currency_m", direction: "down-good", drivers: { reach: 1, effectiveness: 1.1 } },
  { id: "publicBenefitUse", match: "public benefit", label: "Change in Public Benefit Use", shortLabel: "Public benefits", unit: "", format: "currency_m", direction: "down-good", drivers: { reach: 0.9, effectiveness: 1 } },
  // Sign convention: positive = the policy REDUCES the deficit (a budget gain).
  // Annual cost accumulates against that gain and can drive it negative.
  { id: "federalDeficit", match: "federal deficit", label: "Federal Budget Impact", shortLabel: "Budget impact", unit: "", format: "currency_m", direction: "up-good", drivers: { reach: 1, effectiveness: 1 }, offsets: { annualCost: -1 } },
] as const;

function findParam(params: Map<string, number[]>, needle: string): number[] | null {
  for (const [label, values] of params) {
    if (label.toLowerCase().includes(needle)) return values;
  }
  return null;
}

// --- Illustrative curve shaping --------------------------------------------

/**
 * Saturating adoption curve over the time axis, normalized so the final point
 * equals 1. `tau` controls how quickly impact ramps in.
 */
function rampShape(tau: number): number[] {
  const raw = TIME_AXIS.map((t) => 1 - Math.exp(-t / tau));
  const last = raw[raw.length - 1];
  return raw.map((v) => v / last);
}

// Editorial copy + per-area shaping for the five known areas.
// `summary` is one concise sentence (subtitle + description merged) shown in
// the policy header.
const AREA_META: Record<
  string,
  { summary: string; accentToken: string; scale: number; tau: number }
> = {
  "child-tax-credit": {
    summary:
      "Direct economic support for families through periodic payments that lower household financial strain, easing a known driver of mental health need.",
    accentToken: "viz-1",
    scale: 1,
    tau: 6,
  },
  "integrated-preventive-care": {
    summary:
      "Mental health built into primary care, embedding screening and early treatment in routine visits so needs are caught before they escalate.",
    accentToken: "viz-3",
    scale: 0.82,
    tau: 4.5,
  },
  "enhanced-social-supports": {
    summary:
      "Stronger community safety nets that expand housing, food, and crisis supports, buffering people against the conditions that worsen mental health.",
    accentToken: "viz-2",
    scale: 0.68,
    tau: 7,
  },
  "social-media-regulation": {
    summary:
      "Safer digital environments built on design and exposure guardrails that reduce the harms of heavy social media use, especially for youth.",
    accentToken: "viz-5",
    scale: 0.55,
    tau: 9,
  },
  "social-and-emotional-learning": {
    summary:
      "Resilience taught early through school-based programs that build coping and emotional skills, compounding into healthier long-term outcomes.",
    accentToken: "viz-4",
    scale: 0.6,
    tau: 8,
  },
};

function buildArea(name: string, params: Map<string, number[]>): PolicyArea {
  const id = slug(name);
  const meta = AREA_META[id] ?? {
    summary: "Illustrative policy area.",
    accentToken: "viz-1",
    scale: 0.7,
    tau: 6,
  };

  // Anchors: use the source workbook's flat sample values where present,
  // otherwise fall back to the Child Tax Credit reference magnitudes.
  const anchorReach = findParam(params, "reach")?.[0] ?? 100_000;
  const anchorEff = findParam(params, "effectiv")?.[0] ?? 0.3;

  const shape = rampShape(meta.tau);

  // Size the annual cost slider against the gross budget gain it works against,
  // so the tradeoff is legible: the default consumes roughly half the gain over
  // the 10-year scoring window, and the top of the range drives it negative.
  const deficitSource = findParam(params, "federal deficit");
  const deficitAnchor =
    deficitSource?.[deficitSource.length - 1] ?? REFERENCE_ANCHORS.federalDeficit;
  const grossGainAtYear10 = deficitAnchor * meta.scale * shape[TEN_YEAR_INDEX];
  const annualizedGain = grossGainAtYear10 / 10;
  // Both ends of this slider are read off the screen, so they get snapped to
  // round figures. The derived numbers are only as precise as the anchors they
  // come from, and "$32.67M" invites a precision the model cannot support.
  const costMax = niceRound(annualizedGain * 2, 0.5);
  const costDefault = niceRound(annualizedGain * 0.5, 1);
  const costStep = niceStep(costMax);

  const inputs: PolicyArea["inputs"] = [
    {
      id: "reach",
      label: "Reach",
      description: "How many people the policy reaches.",
      unit: "people",
      format: "people_k",
      min: 0,
      max: Math.round(anchorReach * 2),
      step: Math.max(1, Math.round(anchorReach / 100)),
      default: anchorReach,
    },
    {
      id: "annualCost",
      label: "Annual Cost",
      description: "Federal cost per year, subtracted from the budget gain.",
      unit: "per year",
      format: "currency_m",
      min: 0,
      max: costMax,
      step: costStep,
      default: costDefault,
    },
    {
      id: "effectiveness",
      label: "Effectiveness",
      description: "Estimated drop in depression among those reached.",
      unit: "decrease",
      format: "percent",
      min: 0,
      max: 0.6,
      step: 0.01,
      default: anchorEff,
    },
  ];

  const metrics: PolicyArea["metrics"] = [];
  const baselines: Record<string, number[]> = {};

  for (const m of METRICS) {
    const source = findParam(params, m.match);
    const anchor = (source?.[source.length - 1] ?? source?.[0]) ?? null;

    // Reference magnitude per metric (from the CTC sample), scaled per area.
    const referenceAnchor = anchor ?? REFERENCE_ANCHORS[m.id] ?? 100;
    const longRun = referenceAnchor * meta.scale;

    metrics.push({
      id: m.id,
      label: m.label,
      shortLabel: m.shortLabel,
      unit: m.unit,
      format: m.format,
      direction: m.direction,
      drivers: { ...m.drivers },
      ...("offsets" in m ? { offsets: { ...m.offsets } } : {}),
    });

    baselines[m.id] = shape.map((s) => round(longRun * s, m.format));
  }

  return {
    id,
    name,
    summary: meta.summary,
    accentToken: meta.accentToken,
    inputs,
    metrics,
    baselines,
    // Budget impact leads: it is the framing federal policymakers score against.
    primaryMetricId: "federalDeficit",
    basicInputIds: ["reach", "annualCost"],
    basicMetricIds: ["federalDeficit", "mhPrevalence", "gdp"],
  };
}

// CTC reference magnitudes (long-run, at default inputs) from the sample sheet.
const REFERENCE_ANCHORS: Record<string, number> = {
  mhPrevalence: 100_000,
  laborSupply: 10_000,
  laborProductivity: 20,
  savings: 200,
  gdp: 200,
  medicaidSpending: 1.1,
  publicBenefitUse: 0.9,
  federalDeficit: 200,
};

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Snap to a round figure scaled to the value's own magnitude, so the result
 * stays legible whether the number is single digits or hundreds. `fraction` is
 * the increment as a share of that magnitude: 0.5 rounds 32.67 to the nearest
 * 5 (35), while 1 rounds 8.17 to the nearest whole (8).
 */
function niceRound(value: number, fraction: number): number {
  if (!(value > 0)) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const increment = magnitude * fraction;
  return roundTo(Math.round(value / increment) * increment, 4);
}

/**
 * Coarsest step that still gives the slider at least ~30 stops, taken from a
 * ladder of round increments so every position lands on a clean figure rather
 * than only the endpoints being tidy.
 */
function niceStep(max: number): number {
  const ladder = [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100];
  return ladder.find((s) => s >= max / 100) ?? 100;
}

function round(value: number, format: string): number {
  if (format === "percent") return Math.round(value * 1000) / 1000;
  if (format === "currency_m") return Math.round(value * 100) / 100;
  return Math.round(value);
}

// --- Main ------------------------------------------------------------------

function main() {
  const grid = readGrid(SOURCE);
  const parsed = parseAreas(grid);
  if (parsed.length === 0) throw new Error("No policy areas found in workbook.");

  const areas = parsed.map((a) => buildArea(a.name, a.params));

  const dataset = {
    meta: {
      version: "0.1.0",
      dataQuality: "illustrative" as const,
      source: "data/source/example-spreadsheet.xlsx",
      generatedAt: new Date().toISOString(),
      disclaimer:
        "Illustrative sample data for prototype purposes only. Values do not represent verified policy projections.",
    },
    timeAxis: TIME_AXIS,
    areas,
  };

  const validated = policyDatasetSchema.parse(dataset);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(validated, null, 2) + "\n");

  console.log(
    `Wrote ${OUT}\n  areas: ${validated.areas.map((a) => a.id).join(", ")}\n  quality: ${validated.meta.dataQuality}`,
  );
}

main();
