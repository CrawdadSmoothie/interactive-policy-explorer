import type { Format } from "number-flow";
import type { MetricFormat } from "./types";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  notation: "compact",
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 1,
});

/**
 * Convert a stored value into real-world units, then a compact display string.
 * Stored units follow the spreadsheet (people in thousands, dollars in millions, etc).
 */
export function formatValue(value: number, format: MetricFormat): string {
  switch (format) {
    case "people_k":
      return compact.format(value * 1_000);
    case "percent":
      return `${(value * 100).toLocaleString("en-US", {
        maximumFractionDigits: value * 100 % 1 === 0 ? 0 : 1,
      })}%`;
    case "currency":
      return compactCurrency.format(value);
    case "currency_m":
      return compactCurrency.format(value * 1_000_000);
    case "number":
    default:
      return compact.format(value);
  }
}

/** A concise unit suffix to pair with a formatted value (for axis/labels). */
export function unitSuffix(format: MetricFormat): string {
  switch (format) {
    case "people_k":
      return "people";
    case "percent":
      return "";
    case "currency":
    case "currency_m":
      return "";
    case "number":
    default:
      return "";
  }
}

/** Numeric value in real-world units (for chart scales / NumberFlow). */
export function toDisplayNumber(value: number, format: MetricFormat): number {
  switch (format) {
    case "people_k":
      return value * 1_000;
    case "percent":
      return value * 100;
    case "currency_m":
      return value * 1_000_000;
    case "currency":
    case "number":
    default:
      return value;
  }
}

/** Options for <NumberFlow /> so it matches our formatting. */
export function numberFlowFormat(format: MetricFormat): Format {
  switch (format) {
    case "percent":
      return { maximumFractionDigits: 1 };
    case "currency":
    case "currency_m":
      return {
        notation: "compact",
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 1,
      };
    case "people_k":
    case "number":
    default:
      return { notation: "compact", maximumFractionDigits: 1 };
  }
}

/** Suffix shown after a percent NumberFlow (which strips the % via options). */
export function numberFlowSuffix(format: MetricFormat): string {
  return format === "percent" ? "%" : "";
}

/** Convert a stored value into an editable draft string (display units). */
export function toEditDraft(value: number, format: MetricFormat): string {
  switch (format) {
    case "percent":
      return String(Math.round(value * 1000) / 10); // e.g. 0.3 -> "30"
    default:
      return formatValue(value, format).replace(/[$,]/g, "");
  }
}

/** Short unit hint shown beside the edit field. */
export function editHint(format: MetricFormat): string {
  switch (format) {
    case "percent":
      return "%";
    case "people_k":
      return "people";
    case "currency":
      return "$";
    case "currency_m":
      return "$ (millions)";
    default:
      return "";
  }
}

/**
 * Parse a typed string (supporting commas, $, %, and k/m/b suffixes) into a
 * value in DISPLAY units, then convert back to the stored unit for `format`.
 * Returns null if it can't be parsed.
 */
export function parseToStored(input: string, format: MetricFormat): number | null {
  let s = input.trim().toLowerCase().replace(/[,$%\s]/g, "");
  if (!s) return null;

  let mult = 1;
  const suffix = s.match(/([kmb])$/);
  if (suffix) {
    mult = suffix[1] === "k" ? 1e3 : suffix[1] === "m" ? 1e6 : 1e9;
    s = s.slice(0, -1);
  }
  const display = parseFloat(s);
  if (!Number.isFinite(display)) return null;
  const displayValue = display * mult;

  switch (format) {
    case "people_k":
      return displayValue / 1_000;
    case "percent":
      return displayValue / 100;
    case "currency_m":
      return displayValue / 1_000_000;
    default:
      return displayValue;
  }
}
