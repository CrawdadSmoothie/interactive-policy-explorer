"use client";

import { useMemo } from "react";
import { line as d3line, curveMonotoneX } from "d3-shape";
import { motion, useReducedMotion } from "motion/react";

interface Props {
  series: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ series, width = 96, height = 32, className }: Props) {
  const reduce = useReducedMotion();
  const pad = 3;

  const d = useMemo(() => {
    const max = Math.max(1, ...series);
    const min = Math.min(0, ...series);
    const range = max - min || 1;
    const stepX = (width - pad * 2) / Math.max(1, series.length - 1);
    const pts: [number, number][] = series.map((v, i) => [
      pad + i * stepX,
      height - pad - ((v - min) / range) * (height - pad * 2),
    ]);
    return d3line<[number, number]>()
      .x((p) => p[0])
      .y((p) => p[1])
      .curve(curveMonotoneX)(pts) ?? "";
  }, [series, width, height]);

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <motion.path
        d={d}
        fill="none"
        style={{ stroke: "var(--area-accent)" }}
        strokeWidth={1.75}
        strokeLinecap="round"
        animate={{ d }}
        transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
