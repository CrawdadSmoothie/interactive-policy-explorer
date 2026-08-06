"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getArea, timeAxis } from "@/lib/dataset";
import { useExplorer, type Horizon } from "@/store/explorer";
import { computeOutputs, horizonLength } from "@/lib/calc";
import { accentVar, cn } from "@/lib/utils";
import { PolicyNav } from "./PolicyNav";
import { InputsPanel } from "./InputsPanel";
import { ImpactChart } from "./ImpactChart";
import { SegmentedControl } from "./SegmentedControl";
import { StatCard } from "./StatCard";
import { ChevronDown, CloseIcon } from "./icons";

export function Explorer() {
  const reduce = useReducedMotion();
  const selectedAreaId = useExplorer((s) => s.selectedAreaId);
  const valuesByArea = useExplorer((s) => s.valuesByArea);
  const metricByArea = useExplorer((s) => s.metricByArea);
  const setMetric = useExplorer((s) => s.setMetric);
  const horizon = useExplorer((s) => s.horizon);
  const setHorizon = useExplorer((s) => s.setHorizon);
  const pinnedYearIndex = useExplorer((s) => s.pinnedYearIndex);
  const setPinnedYearIndex = useExplorer((s) => s.setPinnedYearIndex);

  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const area = getArea(selectedAreaId);
  const values = valuesByArea[selectedAreaId];

  const outputs = useMemo(
    () => (area ? computeOutputs(area, values, timeAxis) : {}),
    [area, values],
  );

  // The axis is sparse past year 10 ([1..10, 20, 30]), so the horizon is a
  // count of points rather than a fixed stride.
  const points = horizonLength(timeAxis, horizon);
  const years = useMemo(() => timeAxis.slice(0, points), [points]);

  if (!area) return null;

  // The headline metrics lead; the rest sit behind a disclosure.
  const basicMetrics = area.basicMetricIds
    .map((id) => area.metrics.find((m) => m.id === id))
    .filter((m) => m != null);
  const extraMetrics = area.metrics.filter(
    (m) => !area.basicMetricIds.includes(m.id),
  );
  const visibleMetrics = showAllMetrics
    ? [...basicMetrics, ...extraMetrics]
    : basicMetrics;

  // Resolved against every metric, not just the visible ones, so collapsing
  // the tile list never yanks the chart out from under the user.
  const metric =
    area.metrics.find((m) => m.id === metricByArea[area.id]) ??
    area.metrics.find((m) => m.id === area.primaryMetricId) ??
    area.metrics[0];

  const clip = (series: number[]) => series.slice(0, points);
  const atIndex =
    pinnedYearIndex != null && pinnedYearIndex < years.length ? pinnedYearIndex : null;
  const atYear = atIndex != null ? years[atIndex] : years[years.length - 1];

  const ease = [0.16, 1, 0.3, 1] as const;

  const headerContainer = reduce
    ? {}
    : {
        initial: "hidden",
        animate: "visible",
        exit: "hidden",
        variants: {
          hidden: {},
          visible: { transition: { staggerChildren: 0.07 } },
        },
      };

  const headerItem = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 8 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
        },
      };

  return (
    <div
      style={{ ["--area-accent" as string]: accentVar(area.accentToken) }}
      className="flex flex-col gap-5"
    >
      <PolicyNav />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
        {/* Left: policy summary + inputs */}
        <div className="flex min-w-0 flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div key={area.id} {...headerContainer}>
              <motion.h2
                className="font-serif text-xl font-semibold leading-tight tracking-tight text-ink sm:text-2xl"
                {...headerItem}
              >
                {area.name}
              </motion.h2>
              <motion.p
                className="mt-1.5 max-w-prose text-[13px] leading-snug text-ink-muted sm:text-sm"
                {...headerItem}
              >
                {area.summary}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          <div className="rounded-xl border border-border bg-surface/50 p-4 sm:p-5">
            <InputsPanel area={area} values={values} />
          </div>
        </div>

        {/* Right: chart + stats */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-soft-sm sm:p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">{metric.label}</h3>
              <SegmentedControl
                label="Impact horizon"
                value={horizon}
                onChange={(v) => setHorizon(v as Horizon)}
                options={[
                  { value: 10 as const, label: "10 yr" },
                  { value: 30 as const, label: "30 yr" },
                ]}
              />
            </div>

            <div className="flex items-center gap-3 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4 rounded-full"
                  style={{ background: "var(--area-accent)" }}
                />
                Adjusted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 border-t-2 border-dotted border-viz-baseline" />
                Default
              </span>
              {/* The pinned year is already called out on the axis and above
                  the tiles, so this only needs to offer the way out. */}
              {atIndex != null ? (
                <button
                  type="button"
                  onClick={() => setPinnedYearIndex(null)}
                  className="ml-auto inline-flex items-center gap-1 font-medium transition-colors hover:text-ink"
                >
                  <CloseIcon className="h-3 w-3" />
                  Clear pin
                </button>
              ) : (
                <span className="ml-auto text-ink-subtle">Tap to pin a year</span>
              )}
            </div>

            <ImpactChart
              years={years}
              scenario={clip(outputs[metric.id] ?? [])}
              baseline={clip(area.baselines[metric.id] ?? [])}
              metric={metric}
              pinnedIndex={atIndex}
              onPin={setPinnedYearIndex}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                Projected impact
              </h3>
              <span
                className={cn(
                  "text-[11px]",
                  atIndex != null ? "font-medium" : "text-ink-subtle",
                )}
                style={atIndex != null ? { color: "var(--area-accent)" } : undefined}
              >
                {atIndex != null ? "At" : "By"} year {atYear}
              </span>
            </div>

            <div
              className={cn(
                "grid grid-cols-3 gap-2 sm:gap-3",
                showAllMetrics ? "lg:grid-cols-4" : "lg:grid-cols-3",
              )}
            >
              {visibleMetrics.map((m) => (
                <StatCard
                  key={m.id}
                  metric={m}
                  scenario={clip(outputs[m.id] ?? [])}
                  baseline={clip(area.baselines[m.id] ?? [])}
                  active={m.id === metric.id}
                  onSelect={() => setMetric(area.id, m.id)}
                  atIndex={atIndex}
                  atYear={atYear}
                />
              ))}
            </div>

            {extraMetrics.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllMetrics((v) => !v)}
                aria-expanded={showAllMetrics}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {showAllMetrics
                  ? "Show fewer metrics"
                  : `Show ${extraMetrics.length} more metrics`}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showAllMetrics && "rotate-180",
                  )}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
