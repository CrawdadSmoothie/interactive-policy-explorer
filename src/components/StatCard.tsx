"use client";

import NumberFlow from "@number-flow/react";
import type { MetricDef } from "@/lib/types";
import {
  numberFlowFormat,
  numberFlowSuffix,
  toDisplayNumber,
} from "@/lib/format";
import { cn, pctChange } from "@/lib/utils";
import { valueAt } from "@/lib/calc";
import { ArrowDownRight, ArrowUpRight } from "./icons";

interface Props {
  metric: MetricDef;
  scenario: number[];
  baseline: number[];
  active?: boolean;
  onSelect?: () => void;
  /** Time index to read; null falls back to the end of the horizon. */
  atIndex: number | null;
  /** Year label for the caption, matching `atIndex`. */
  atYear: number;
  className?: string;
}

export function StatCard({
  metric,
  scenario,
  baseline,
  active,
  onSelect,
  atIndex,
  atYear,
  className,
}: Props) {
  const value = valueAt(scenario, atIndex);
  const base = valueAt(baseline, atIndex);
  const delta = pctChange(value, base);
  const display = toDisplayNumber(value, metric.format);

  // Whether the change is an improvement depends on the metric, not the sign.
  const better =
    metric.direction === "down-good" ? (delta ?? 0) < 0 : (delta ?? 0) > 0;
  const up = (delta ?? 0) >= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group flex flex-col rounded-lg border p-2.5 text-left transition-all duration-300 sm:p-3.5",
        active
          ? "border-[var(--area-accent)] bg-surface shadow-soft-sm ring-1 ring-[var(--area-accent)]"
          : "border-border bg-surface/60 hover:border-border-strong hover:bg-surface",
        className,
      )}
    >
      {/* Wraps rather than truncates: three tiles sit side by side on a phone,
          so there is not enough room for a label on one line. */}
      <span className="w-full text-[10px] font-medium leading-tight text-ink-muted sm:text-[11px]">
        {metric.shortLabel ?? metric.label}
      </span>

      <div className="tnum mt-auto pt-3 text-lg font-semibold leading-none tracking-tight text-ink sm:pt-5 sm:text-2xl lg:text-[1.75rem]">
        <NumberFlow
          value={display}
          format={numberFlowFormat(metric.format)}
          suffix={numberFlowSuffix(metric.format)}
        />
      </div>

      {/* The delta sits on the caption row so it never squeezes the label. */}
      <div className="mt-1 flex w-full items-center justify-between gap-2">
        <span className="hidden whitespace-nowrap text-[11px] text-ink-subtle sm:inline">
          by Year {atYear}
        </span>
        {delta != null && Math.abs(delta) > 0.001 && (
          <span
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold tabular-nums",
              better ? "text-[var(--area-accent)]" : "text-ink-subtle",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </button>
  );
}
