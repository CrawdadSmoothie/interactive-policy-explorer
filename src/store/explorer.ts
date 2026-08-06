"use client";

import { create } from "zustand";
import { areas, defaultAreaId, getArea } from "@/lib/dataset";
import { defaultInputs, type InputValues } from "@/lib/calc";

/** Federal budget analysts score over 10 years, so that is the default view. */
export type Horizon = 10 | 30;

interface ExplorerState {
  selectedAreaId: string;
  /** Input values per area, so switching areas preserves a user's adjustments. */
  valuesByArea: Record<string, InputValues>;
  /** Which output metric the hero chart is showing. */
  metricByArea: Record<string, string>;
  /** How many years of the projection to show. */
  horizon: Horizon;
  /**
   * Time index pinned by tapping the chart. Drives the metric tiles so touch
   * users, who have no hover, can still read any year. Null means "horizon end".
   */
  pinnedYearIndex: number | null;

  selectArea: (id: string) => void;
  setInput: (areaId: string, inputId: string, value: number) => void;
  resetArea: (areaId: string) => void;
  setMetric: (areaId: string, metricId: string) => void;
  setHorizon: (horizon: Horizon) => void;
  setPinnedYearIndex: (index: number | null) => void;
}

function seedValues(): Record<string, InputValues> {
  const map: Record<string, InputValues> = {};
  for (const area of areas) map[area.id] = defaultInputs(area);
  return map;
}

function seedMetrics(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const area of areas) map[area.id] = area.primaryMetricId;
  return map;
}

export const useExplorer = create<ExplorerState>((set) => ({
  selectedAreaId: defaultAreaId,
  valuesByArea: seedValues(),
  metricByArea: seedMetrics(),
  horizon: 10,
  pinnedYearIndex: null,

  // Switching areas re-renders a different series, so a pinned year from the
  // previous area no longer means anything.
  selectArea: (id) => set({ selectedAreaId: id, pinnedYearIndex: null }),

  setInput: (areaId, inputId, value) =>
    set((state) => ({
      valuesByArea: {
        ...state.valuesByArea,
        [areaId]: { ...state.valuesByArea[areaId], [inputId]: value },
      },
    })),

  resetArea: (areaId) =>
    set((state) => {
      const area = getArea(areaId);
      if (!area) return state;
      return {
        valuesByArea: {
          ...state.valuesByArea,
          [areaId]: defaultInputs(area),
        },
      };
    }),

  setMetric: (areaId, metricId) =>
    set((state) => ({
      metricByArea: { ...state.metricByArea, [areaId]: metricId },
    })),

  // A pin past the new horizon would be off-chart, so drop it.
  setHorizon: (horizon) => set({ horizon, pinnedYearIndex: null }),

  setPinnedYearIndex: (index) => set({ pinnedYearIndex: index }),
}));
