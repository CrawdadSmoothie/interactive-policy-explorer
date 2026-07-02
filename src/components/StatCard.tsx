"use client";

import NumberFlow from "@number-flow/react";
import type { MetricDef } from "@/lib/types";
import {
  numberFlowFormat,
  numberFlowSuffix,
  toDisplayNumber,
} from "@/lib/format";
import { cn, pctChange } from "@/lib/utils";
import { longRunValue } from "@/lib/calc";
import { ArrowDownRight, ArrowUpRight } from "./icons";

interface Props {
  metric: MetricDef;
  scenario: number[];
  baseline: number[];
  active?: boolean;
  onSelect?: () => void;
}

export function StatCard({ metric, scenario, baseline, active, onSelect }: Props) {
  const value = longRunValue(scenario);
  const base = longRunValue(baseline);
  const delta = pctChange(value, base);
  const display = toDisplayNumber(value, metric.format);

  const up = (delta ?? 0) >= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group flex flex-col rounded-lg border p-3.5 text-left transition-all duration-300",
        active
          ? "border-[var(--area-accent)] bg-surface shadow-soft-sm ring-1 ring-[var(--area-accent)]"
          : "border-border bg-surface/60 hover:border-border-strong hover:bg-surface",
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-ink-muted">
          {metric.shortLabel ?? metric.label}
        </span>
        {delta != null && Math.abs(delta) > 0.001 && (
          <span
            className={cn(
              "-mr-0.5 inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-1 py-0.5 text-[10px] font-semibold tabular-nums",
              up ? "text-[var(--area-accent)]" : "text-ink-subtle",
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

      <div className="tnum mt-5 text-[1.75rem] font-semibold leading-none tracking-tight text-ink">
        <NumberFlow
          value={display}
          format={numberFlowFormat(metric.format)}
          suffix={numberFlowSuffix(metric.format)}
        />
      </div>

      <span className="mt-1 whitespace-nowrap text-[11px] text-ink-subtle">
        by Year 30
      </span>
    </button>
  );
}
