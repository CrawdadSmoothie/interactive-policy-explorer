"use client";

import { useState } from "react";
import type { PolicyArea } from "@/lib/types";
import type { InputValues } from "@/lib/calc";
import { useExplorer } from "@/store/explorer";
import { cn } from "@/lib/utils";
import { InputSlider } from "./InputSlider";
import { ChevronDown, ResetIcon } from "./icons";

interface Props {
  area: PolicyArea;
  values: InputValues;
}

export function InputsPanel({ area, values }: Props) {
  const setInput = useExplorer((s) => s.setInput);
  const resetArea = useExplorer((s) => s.resetArea);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const isDefault = area.inputs.every((i) => values[i.id] === i.default);

  // Only confirmed (non-optional) inputs are shown at all. Of those, the basic
  // set is always visible and the rest sit behind the disclosure.
  const usable = area.inputs.filter((i) => !i.optional);
  const primary = usable.filter((i) => area.basicInputIds.includes(i.id));
  const advanced = usable.filter((i) => !area.basicInputIds.includes(i.id));

  const render = (input: (typeof usable)[number]) => (
    <InputSlider
      key={input.id}
      input={input}
      value={values[input.id] ?? input.default}
      onChange={(v) => setInput(area.id, input.id, v)}
    />
  );

  return (
    <section aria-label="Adjustable inputs" className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
          Adjust the inputs
        </h2>
        <button
          type="button"
          onClick={() => resetArea(area.id)}
          disabled={isDefault}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ResetIcon className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-6">{primary.map(render)}</div>

      {advanced.length > 0 && (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className="flex w-full items-center justify-between gap-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
          >
            {showAdvanced ? "Hide" : "Show"} advanced assumptions
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showAdvanced && "rotate-180",
              )}
            />
          </button>

          {showAdvanced && (
            <div className="mt-5 flex flex-col gap-6">{advanced.map(render)}</div>
          )}
        </div>
      )}
    </section>
  );
}
