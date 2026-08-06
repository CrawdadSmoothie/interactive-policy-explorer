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
  /** Time index pinned by tapping, which drives the metric tiles. */
  pinnedIndex: number | null;
  onPin: (index: number | null) => void;
}

const MARGIN = { top: 18, right: 20, bottom: 30, left: 52 };

/**
 * Brand star watermark behind the plot, off while the chart graphics are being
 * tuned. Flip to true to bring it back; the asset stays at public/brand.
 */
const SHOW_STAR_WATERMARK: boolean = false;

export function ImpactChart(props: Props) {
  return (
    <div className="h-[clamp(210px,32vh,380px)] w-full">
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
  pinnedIndex,
  onPin,
  width,
  height,
}: Props & { width: number; height: number }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  // Hover wins while the mouse is over the chart; otherwise a tapped year
  // stays put. Touch devices never hover, so the pin is their only readout.
  const active = hover ?? pinnedIndex;

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

  // Budget impact can go negative once annual cost outweighs the gain, so the
  // domain has to reach below zero rather than clipping at it.
  const yMax = Math.max(1, ...scenario, ...baseline);
  const yMin = Math.min(0, ...scenario, ...baseline);
  const yScale = useMemo(
    () => scaleLinear({ domain: [yMin, yMax], range: [innerH, 0], nice: true }),
    [yMin, yMax, innerH],
  );
  const zeroY = yScale(0) ?? innerH;

  const points = (series: number[]): [number, number][] =>
    series.map((v, i) => [xScale(years[i]) ?? 0, yScale(v) ?? 0]);

  const lineGen = d3line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveMonotoneX);
  const areaGen = d3area<[number, number]>()
    .x((d) => d[0])
    .y0(zeroY)
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

  const pinX = pinnedIndex != null ? xScale(years[pinnedIndex]) ?? 0 : 0;
  const pinY = pinnedIndex != null ? yScale(scenario[pinnedIndex]) ?? 0 : 0;
  const pinLabel = pinnedIndex != null ? `Yr ${years[pinnedIndex]}` : "";
  const pinChipW = pinLabel.length * 5.6 + 12;

  // The pinned year gets its own axis chip, so drop any regular tick that
  // would collide with it.
  const spacedXTicks =
    pinnedIndex == null
      ? xTicks
      : xTicks.filter((t) => Math.abs((xScale(t) ?? 0) - pinX) > pinChipW / 2 + 10);

  // Hover only draws its own marker when it is somewhere else; on the pinned
  // year the pin marker already covers it.
  const showHover = hover != null && hover !== pinnedIndex;

  const lastX = xScale(years[years.length - 1]) ?? 0;
  const lastY = yScale(scenario[scenario.length - 1]) ?? 0;

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const };

  function nearestIndex(clientX: number, target: SVGRectElement): number {
    const rect = target.getBoundingClientRect();
    const year = xScale.invert(clientX - rect.left);
    let nearest = 0;
    let best = Infinity;
    years.forEach((y, i) => {
      const d = Math.abs(y - year);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    return nearest;
  }

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    // Touch drags also fire pointermove; leave those to the tap handler so a
    // tap does not leave a stale hover behind on a device that cannot unhover.
    if (e.pointerType === "touch") return;
    setHover(nearestIndex(e.clientX, e.currentTarget));
  }

  function handleTap(e: React.PointerEvent<SVGRectElement>) {
    const index = nearestIndex(e.clientX, e.currentTarget);
    onPin(index === pinnedIndex ? null : index);
  }

  const activeX = active != null ? xScale(years[active]) ?? 0 : 0;
  const hoverX = hover != null ? xScale(years[hover]) ?? 0 : 0;
  const hoverY = hover != null ? yScale(scenario[hover]) ?? 0 : 0;

  return (
    <svg width={width} height={height} role="img" aria-label={`${metric.label} over time`}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--area-accent)", stopOpacity: 0.22 }} />
          <stop offset="100%" style={{ stopColor: "var(--area-accent)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Sits at the very back so gridlines, the area fill and the line all
            read over it. The asset is a flat near-white shape, already subtle
            on the light card but glaring on the dark surface, so dark mode
            dials it back with opacity rather than a second asset. Height-fitted
            and centred, so it shrinks on narrow viewports instead of
            overflowing the plot. */}
        {SHOW_STAR_WATERMARK && (
          <image
            href="/brand/star.svg"
            x={0}
            y={0}
            width={innerW}
            height={innerH}
            preserveAspectRatio="xMidYMid meet"
            className="opacity-100 dark:opacity-[0.045]"
            pointerEvents="none"
            aria-hidden="true"
          />
        )}

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
        {spacedXTicks.map((t) => (
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

        {/* Zero line: the break-even point between a budget gain and a cost */}
        {yMin < 0 && (
          <line
            x1={0}
            x2={innerW}
            y1={zeroY}
            y2={zeroY}
            style={{ stroke: "var(--border-strong)" }}
            strokeWidth={1}
          />
        )}

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

        {/* Pinned year. Persists under the hover marker so you never lose the
            year the metric tiles are reporting. Drawn as a hollow target with
            a dashed guide and an axis chip, which reads as deliberately placed
            rather than as the solid dot that merely follows the cursor. */}
        {pinnedIndex != null && (
          <g pointerEvents="none">
            <line
              x1={pinX}
              x2={pinX}
              y1={0}
              y2={innerH}
              style={{ stroke: "var(--area-accent)" }}
              strokeOpacity={0.45}
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <motion.g animate={{ x: pinX, y: pinY }} transition={transition}>
              <circle
                r={10}
                style={{ fill: "var(--area-accent)" }}
                opacity={0.13}
              />
              <circle
                r={5.5}
                fill="var(--surface)"
                style={{ stroke: "var(--area-accent)" }}
                strokeWidth={2}
              />
              <circle r={1.8} style={{ fill: "var(--area-accent)" }} />
            </motion.g>

            {/* Year chip on the axis: the anchor for "what the numbers mean" */}
            <rect
              x={pinX - pinChipW / 2}
              y={innerH + 9}
              width={pinChipW}
              height={15}
              rx={7.5}
              style={{ fill: "var(--area-accent)" }}
            />
            <text
              x={pinX}
              y={innerH + 17}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--surface)"
              className="text-[10px] font-semibold"
            >
              {pinLabel}
            </text>
          </g>
        )}

        {/* Transient hover marker: a solid dot on a solid hairline */}
        {showHover && (
          <g pointerEvents="none">
            <line
              x1={hoverX}
              x2={hoverX}
              y1={0}
              y2={innerH}
              style={{ stroke: "var(--area-accent)" }}
              strokeOpacity={0.3}
              strokeWidth={1}
            />
            <circle
              cx={hoverX}
              cy={hoverY}
              r={4.5}
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
          className="cursor-pointer"
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
          onPointerUp={handleTap}
        />
      </g>

      {/* Floating readout for the hovered or pinned year */}
      {active != null && (
        <foreignObject
          x={Math.min(Math.max(MARGIN.left + activeX - 105, 0), Math.max(0, width - 210))}
          y={4}
          width={210}
          height={96}
          pointerEvents="none"
          style={{ overflow: "visible" }}
        >
          <div className="inline-block rounded-lg border border-border bg-surface/95 px-3 py-2 shadow-soft-md backdrop-blur">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-subtle">
              Year {years[active]}
              {active === pinnedIndex && (
                <span
                  className="rounded-full px-1.5 py-px text-[9px] tracking-normal"
                  style={{
                    background: "var(--area-accent)",
                    color: "var(--surface)",
                  }}
                >
                  Pinned
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-5 text-[11px] whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--area-accent)" }}
                />
                Adjusted scenario
              </span>
              <span className="tnum font-semibold text-ink">{fmt(scenario[active])}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-5 text-[11px] whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--viz-baseline)" }}
                />
                Default scenario
              </span>
              <span className="tnum text-ink-muted">{fmt(baseline[active])}</span>
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
