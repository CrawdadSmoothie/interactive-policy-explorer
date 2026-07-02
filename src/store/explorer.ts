"use client";

import { create } from "zustand";
import { areas, defaultAreaId, getArea } from "@/lib/dataset";
import { defaultInputs, type InputValues } from "@/lib/calc";

interface ExplorerState {
  selectedAreaId: string;
  /** Input values per area, so switching areas preserves a user's adjustments. */
  valuesByArea: Record<string, InputValues>;
  /** Which output metric the hero chart is showing. */
  metricByArea: Record<string, string>;

  selectArea: (id: string) => void;
  setInput: (areaId: string, inputId: string, value: number) => void;
  resetArea: (areaId: string) => void;
  setMetric: (areaId: string, metricId: string) => void;
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

  selectArea: (id) => set({ selectedAreaId: id }),

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
}));
