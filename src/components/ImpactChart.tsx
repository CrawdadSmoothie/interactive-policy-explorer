"use client";

import { useMemo, useState } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { line as d3line, area as d3area, curveMonotoneX } from "d3-shape";
import { motion, useReducedMotion } from "motion/react";
import type { MetricDef } from "@/lib/types";
import { formatValue } from "@/lib/format";

interface Props {
  years: number[];
  scenario: number[];
  baseline: number[];
  metric: MetricDef;
}

const MARGIN = { top: 18, right: 20, bottom: 30, left: 52 };

export function ImpactChart(props: Props) {
  return (
    <div className="h-[clamp(280px,42vh,440px)] w-full">
      <ParentSize debounceTime={16}>
        {({ width, height }) =>
          width > 0 && height > 0 ? (
            <Chart {...props} width={width} height={height} />
          ) : null
        }
      </ParentSize>
    </div>
  );
}

function Chart({
  years,
  scenario,
  baseline,
  metric,
  width,
  height,
}: Props & { width: number; height: number }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  // Single formatter so the symbol (%, $) is never duplicated by the unit label.
  const fmt = (v: number) =>
    `${formatValue(v, metric.format)}${metric.unit ? ` ${metric.unit}` : ""}`;

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const xScale = useMemo(
    () =>
      scaleLinear({
        domain: [years[0], years[years.length - 1]],
        range: [0, innerW],
      }),
    [years, innerW],
  );

  const yMax = Math.max(1, ...scenario, ...baseline);
  const yScale = useMemo(
    () => scaleLinear({ domain: [0, yMax], range: [innerH, 0], nice: true }),
    [yMax, innerH],
  );

  const points = (series: number[]): [number, number][] =>
    series.map((v, i) => [xScale(years[i]) ?? 0, yScale(v) ?? 0]);

  const lineGen = d3line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveMonotoneX);
  const areaGen = d3area<[number, number]>()
    .x((d) => d[0])
    .y0(innerH)
    .y1((d) => d[1])
    .curve(curveMonotoneX);

  const scenarioPts = points(scenario);
  const baselinePts = points(baseline);
  const scenarioLine = lineGen(scenarioPts) ?? "";
  const scenarioArea = areaGen(scenarioPts) ?? "";
  const baselineLine = lineGen(baselinePts) ?? "";

  const yTicks = yScale.ticks(4);
  const xTicks = [years[0], 5, 10, 20, years[years.length - 1]].filter(
    (t, i, arr) => arr.indexOf(t) === i && t >= years[0] && t <= years[years.length - 1],
  );

  const lastX = xScale(years[years.length - 1]) ?? 0;
  const lastY = yScale(scenario[scenario.length - 1]) ?? 0;

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const };

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const year = xScale.invert(x);
    let nearest = 0;
    let best = Infinity;
    years.forEach((y, i) => {
      const d = Math.abs(y - year);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  const hoverX = hover != null ? xScale(years[hover]) ?? 0 : 0;
  const hoverYScenario = hover != null ? yScale(scenario[hover]) ?? 0 : 0;

  return (
    <svg width={width} height={height} role="img" aria-label={`${metric.label} over time`}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--area-accent)", stopOpacity: 0.22 }} />
          <stop offset="100%" style={{ stopColor: "var(--area-accent)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Horizontal gridlines + y labels */}
        {yTicks.map((t) => {
          const y = yScale(t) ?? 0;
          return (
            <g key={t}>
              <line
                x1={0}
                x2={innerW}
                y1={y}
                y2={y}
                style={{ stroke: "var(--viz-grid)" }}
                strokeWidth={1}
              />
              <text
                x={-12}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="tnum fill-ink-subtle text-[10px]"
              >
                {formatValue(t, metric.format)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {xTicks.map((t) => (
          <text
            key={t}
            x={xScale(t) ?? 0}
            y={innerH + 20}
            textAnchor="middle"
            className="fill-ink-subtle text-[10px]"
          >
            Yr {t}
          </text>
        ))}

        {/* Baseline (default inputs) reference */}
        <motion.path
          d={baselineLine}
          fill="none"
          style={{ stroke: "var(--viz-baseline)" }}
          strokeWidth={1.5}
          strokeDasharray="2 4"
          animate={{ d: baselineLine }}
          transition={transition}
        />

        {/* Scenario area + line */}
        <motion.path
          d={scenarioArea}
          fill="url(#area-grad)"
          animate={{ d: scenarioArea }}
          transition={transition}
        />
        <motion.path
          d={scenarioLine}
          fill="none"
          style={{ stroke: "var(--area-accent)" }}
          strokeWidth={2.5}
          strokeLinecap="round"
          animate={{ d: scenarioLine }}
          transition={transition}
        />

        {/* Endpoint marker */}
        <motion.circle
          cx={lastX}
          cy={lastY}
          r={4}
          style={{ fill: "var(--area-accent)" }}
          stroke="var(--surface)"
          strokeWidth={2}
          animate={{ cx: lastX, cy: lastY }}
          transition={transition}
        />

        {/* Hover crosshair */}
        {hover != null && (
          <g pointerEvents="none">
            <line
              x1={hoverX}
              x2={hoverX}
              y1={0}
              y2={innerH}
              style={{ stroke: "var(--area-accent)" }}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
            <circle
              cx={hoverX}
              cy={hoverYScenario}
              r={5}
              style={{ fill: "var(--area-accent)" }}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          </g>
        )}

        {/* Interaction surface */}
        <rect
          x={0}
          y={0}
          width={innerW}
          height={innerH}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
        />
      </g>

      {/* Floating hover label */}
      {hover != null && (
        <foreignObject
          x={Math.min(Math.max(MARGIN.left + hoverX - 105, 0), Math.max(0, width - 210))}
          y={4}
          width={210}
          height={96}
          pointerEvents="none"
          style={{ overflow: "visible" }}
        >
          <div className="inline-block rounded-lg border border-border bg-surface/95 px-3 py-2 shadow-soft-md backdrop-blur">
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-subtle">
              Year {years[hover]}
            </div>
            <div className="flex items-center justify-between gap-5 text-[11px] whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--area-accent)" }}
                />
                Adjusted scenario
              </span>
              <span className="tnum font-semibold text-ink">{fmt(scenario[hover])}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-5 text-[11px] whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--viz-baseline)" }}
                />
                Default scenario
              </span>
              <span className="tnum text-ink-muted">{fmt(baseline[hover])}</span>
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
