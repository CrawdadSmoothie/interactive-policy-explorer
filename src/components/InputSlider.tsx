"use client";

import { useId, useRef, useState } from "react";
import type { InputDef } from "@/lib/types";
import {
  editHint,
  formatValue,
  parseToStored,
  toEditDraft,
} from "@/lib/format";
import { clamp, cn } from "@/lib/utils";

interface Props {
  input: InputDef;
  value: number;
  onChange: (value: number) => void;
}

export function InputSlider({ input, value, onChange }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const range = input.max - input.min || 1;
  const pct = ((value - input.min) / range) * 100;
  const defaultPct = ((input.default - input.min) / range) * 100;

  /** Snap a stored value to the input's step and clamp to its range. */
  function normalize(stored: number): number {
    const snapped =
      input.step > 0 ? Math.round(stored / input.step) * input.step : stored;
    // Avoid floating-point dust from step snapping.
    const fixed = Number(snapped.toFixed(6));
    return clamp(fixed, input.min, input.max);
  }

  function startEditing() {
    setDraft(toEditDraft(value, input.format));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const parsed = parseToStored(draft, input.format);
    if (parsed != null) onChange(normalize(parsed));
    setEditing(false);
  }

  return (
    <div className="select-none">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {input.label}
        </label>

        {editing ? (
          <span className="flex items-baseline gap-1">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              aria-label={`${input.label} value`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              className="tnum w-24 rounded-md border border-[var(--area-accent)] bg-surface px-2 py-0.5 text-right text-sm font-semibold text-ink outline-none"
            />
            {editHint(input.format) && (
              <span className="text-xs text-ink-subtle">{editHint(input.format)}</span>
            )}
          </span>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            title="Click to type a value"
            className="group/edit -mx-1.5 -my-0.5 rounded-md px-1.5 py-0.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            <span className="tnum decoration-ink-subtle/40 decoration-dotted underline-offset-4 group-hover/edit:underline">
              {formatValue(value, input.format)}
            </span>
            {input.unit && (
              <span className="ml-1 font-normal text-ink-subtle">{input.unit}</span>
            )}
          </button>
        )}
      </div>

      {input.description && (
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
          {input.description}
        </p>
      )}

      <div className="group relative mt-3 h-6">
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
        {/* Default marker */}
        <div
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-border-strong"
          style={{ left: `${defaultPct}%` }}
          aria-hidden
        />
        {/* Fill */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--area-accent)] transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--area-accent)] bg-surface shadow-soft-sm transition-[left] duration-150 ease-out group-hover:scale-110 group-active:scale-105"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
        {/* Native input for accessibility + interaction */}
        <input
          id={id}
          type="range"
          min={input.min}
          max={input.max}
          step={input.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={`${formatValue(value, input.format)} ${input.unit}`}
          className={cn(
            "absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent",
            "[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent",
          )}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-ink-subtle">
        <span>{formatValue(input.min, input.format)}</span>
        <span>{formatValue(input.max, input.format)}</span>
      </div>
    </div>
  );
}
