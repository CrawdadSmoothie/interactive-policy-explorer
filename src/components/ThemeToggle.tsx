"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MoonIcon, SunIcon } from "./icons";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

/**
 * The `dark` class on <html> is the source of truth -- an inline script in the
 * layout sets it before paint. Subscribing to it directly keeps this button in
 * sync without duplicating the theme into React state.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function ThemeToggle({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  const isDark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false, // Server renders the light default.
  );

  function setMode(next: Theme) {
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    try {
      localStorage.setItem("ipe-theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={() => setMode(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-surface-2 p-1 transition-colors hover:border-border-strong",
        className,
      )}
    >
      {/* Sliding knob — inset-y keeps it evenly centered regardless of border */}
      <motion.span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[26px] rounded-full bg-surface shadow-soft-sm ring-1 ring-border"
        animate={{ x: isDark ? 28 : 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 36 }
        }
      />
      {/* Icons */}
      <span className="relative z-10 flex w-1/2 items-center justify-center">
        <SunIcon
          className={cn(
            "h-[15px] w-[15px] transition-colors",
            isDark ? "text-ink-subtle" : "text-ink",
          )}
        />
      </span>
      <span className="relative z-10 flex w-1/2 items-center justify-center">
        <MoonIcon
          className={cn(
            "h-[15px] w-[15px] transition-colors",
            isDark ? "text-ink" : "text-ink-subtle",
          )}
        />
      </span>
    </button>
  );
}
