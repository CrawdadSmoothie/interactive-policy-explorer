"use client";

import type { PolicyArea } from "@/lib/types";
import type { InputValues } from "@/lib/calc";
import { useExplorer } from "@/store/explorer";
import { InputSlider } from "./InputSlider";
import { ResetIcon } from "./icons";

interface Props {
  area: PolicyArea;
  values: InputValues;
}

export function InputsPanel({ area, values }: Props) {
  const setInput = useExplorer((s) => s.setInput);
  const resetArea = useExplorer((s) => s.resetArea);

  const isDefault = area.inputs.every((i) => values[i.id] === i.default);

  // Only confirmed (non-optional) inputs are displayed.
  const visibleInputs = area.inputs.filter((i) => !i.optional);

  return (
    <section aria-label="Adjustable inputs" className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
          Adjust the inputs
        </h2>
        <button
          type="button"
          onClick={() => resetArea(area.id)}
          disabled={isDefault}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ResetIcon className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {visibleInputs.map((input) => (
          <InputSlider
            key={input.id}
            input={input}
            value={values[input.id] ?? input.default}
            onChange={(v) => setInput(area.id, input.id, v)}
          />
        ))}
      </div>
    </section>
  );
}
