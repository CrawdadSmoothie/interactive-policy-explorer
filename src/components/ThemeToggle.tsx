"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MoonIcon, SunIcon } from "./icons";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

export function ThemeToggle({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("ipe-theme") as Theme | null) ?? "light";
    setTheme(stored);
    setMounted(true);
  }, []);

  function setMode(next: Theme) {
    setTheme(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    try {
      localStorage.setItem("ipe-theme", next);
    } catch {}
  }

  const isDark = mounted && theme === "dark";

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
