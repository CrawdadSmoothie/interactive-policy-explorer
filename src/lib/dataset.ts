import raw from "@/data/policies.json";
import { policyDatasetSchema, type PolicyArea } from "./types";

/**
 * Single source of truth for the app. Validated once at module load so any
 * malformed data (e.g. after swapping the spreadsheet) fails loudly.
 */
export const dataset = policyDatasetSchema.parse(raw);

export const areas = dataset.areas;
export const timeAxis = dataset.timeAxis;

export function getArea(id: string): PolicyArea | undefined {
  return areas.find((a) => a.id === id);
}

export const defaultAreaId = areas[0]?.id ?? "";
