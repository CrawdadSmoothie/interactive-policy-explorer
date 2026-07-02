"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getArea, timeAxis } from "@/lib/dataset";
import { useExplorer } from "@/store/explorer";
import { computeOutputs } from "@/lib/calc";
import { accentVar } from "@/lib/utils";
import { PolicyNav } from "./PolicyNav";
import { InputsPanel } from "./InputsPanel";
import { ImpactChart } from "./ImpactChart";
import { StatCard } from "./StatCard";

export function Explorer() {
  const reduce = useReducedMotion();
  const selectedAreaId = useExplorer((s) => s.selectedAreaId);
  const valuesByArea = useExplorer((s) => s.valuesByArea);
  const metricByArea = useExplorer((s) => s.metricByArea);
  const setMetric = useExplorer((s) => s.setMetric);

  const area = getArea(selectedAreaId);
  const values = valuesByArea[selectedAreaId];

  const outputs = useMemo(
    () => (area ? computeOutputs(area, values) : {}),
    [area, values],
  );

  if (!area) return null;

  const metricId = metricByArea[area.id] ?? area.primaryMetricId;
  const metric = area.metrics.find((m) => m.id === metricId) ?? area.metrics[0];

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div
      style={{ ["--area-accent" as string]: accentVar(area.accentToken) }}
      className="flex flex-col gap-8"
    >
      <PolicyNav />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12">
        {/* Left: narrative + inputs */}
        <div className="flex min-w-0 flex-col gap-8">
          <AnimatePresence mode="wait">
            <motion.div key={area.id} {...fade}>
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--area-accent)" }}
                />
                Selected policy
              </div>
              <h2 className="mt-2 font-serif text-[1.75rem] leading-[1.12] tracking-tight text-ink">
                {area.name}
              </h2>
              <p className="mt-2.5 max-w-prose text-[15px] leading-relaxed text-ink-muted">
                {area.summary}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="rounded-xl border border-border bg-surface/50 p-6">
            <InputsPanel area={area} values={values} />
          </div>
        </div>

        {/* Right: chart + stats */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-soft-sm sm:p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">{metric.label}</h3>
                <p className="text-xs text-ink-subtle">Projected over 30 years</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-0.5 w-4 rounded-full"
                    style={{ background: "var(--area-accent)" }}
                  />
                  Adjusted scenario
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 border-t-2 border-dotted border-viz-baseline" />
                  Default scenario
                </span>
              </div>
            </div>

            <ImpactChart
              years={timeAxis}
              scenario={outputs[metric.id] ?? []}
              baseline={area.baselines[metric.id] ?? []}
              metric={metric}
            />

            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-ink-subtle">
              The{" "}
              <span className="font-medium text-ink-muted">default scenario</span>{" "}
              is the projection at each input&rsquo;s default setting. Move the
              sliders to see how your adjusted scenario compares.
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                Projected impact
              </h3>
              <span className="text-[11px] text-ink-subtle">Tap a metric to chart it</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {area.metrics.map((m) => (
                <StatCard
                  key={m.id}
                  metric={m}
                  scenario={outputs[m.id] ?? []}
                  baseline={area.baselines[m.id] ?? []}
                  active={m.id === metric.id}
                  onSelect={() => setMetric(area.id, m.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
