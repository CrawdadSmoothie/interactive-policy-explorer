"use client";

import { motion } from "motion/react";
import { areas } from "@/lib/dataset";
import { useExplorer } from "@/store/explorer";
import { cn } from "@/lib/utils";

export function PolicyNav() {
  const selectedAreaId = useExplorer((s) => s.selectedAreaId);
  const selectArea = useExplorer((s) => s.selectArea);

  return (
    <nav aria-label="Policy areas">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
        Choose a policy area
      </p>

      <div
        role="tablist"
        aria-label="Policy areas"
        className="flex gap-6 overflow-x-auto border-b border-border [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {areas.map((area) => {
          const active = area.id === selectedAreaId;
          return (
            <button
              key={area.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectArea(area.id)}
              className={cn(
                "relative shrink-0 whitespace-nowrap pb-3 pt-1 text-[15px] font-medium transition-colors duration-200 outline-none",
                active ? "text-ink" : "text-ink-subtle hover:text-ink",
              )}
            >
              {area.name}
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  transition={{ type: "spring", stiffness: 480, damping: 40 }}
                  className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--area-accent)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
