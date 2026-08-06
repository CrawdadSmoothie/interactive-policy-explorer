"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "./icons";

/**
 * Citation groups backing the figures in the tool.
 *
 * TODO(kennedy-forum): replace the placeholders with the real reference list.
 * Each entry renders as a single line; add `href` to make it a link.
 */
const REFERENCES: {
  heading: string;
  note: string;
  entries: { text: string; href?: string }[];
}[] = [
  {
    heading: "Effectiveness",
    note: "Sources behind the estimated reduction in depression among people the policy reaches.",
    entries: [{ text: "Reference list to be supplied by The Kennedy Forum." }],
  },
  {
    heading: "Projected impact",
    note: "Sources and methodology behind the projected economic and budget outcomes.",
    entries: [{ text: "Reference list to be supplied by The Kennedy Forum." }],
  },
];

/**
 * Everything that explains the tool but is not part of using it. Collapsed by
 * default so the interactive section stays the focus of the page.
 */
export function Methodology() {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-labelledby="methodology-heading"
      className="mt-10 border-t border-border pt-5"
    >
      <h2 id="methodology-heading" className="sr-only">
        Methodology and references
      </h2>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
          Methodology and references
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="font-serif text-lg text-ink">About the research</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                This tool is based on cutting-edge, rigorous research that
                provides the first ever estimates of how different policy
                options may actually cause later economic and budget impacts,
                aligned with how federal policymakers model policies. The
                research was led by The Kennedy Forum in partnership with S&amp;P
                Global and in collaboration with Charles Rahal, PhD and Jennifer
                Down, PhD from Oxford University and Noemi Kreif, PhD from the
                University of Washington.
              </p>
            </div>

            <div>
              <h3 className="font-serif text-lg text-ink">
                Reading the budget impact
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                Federal budget analysts count how a policy impacts the overall
                federal deficit over 10 years, which is why the tool opens on a
                10-year horizon. Policies that do not impact the deficit, or
                that decrease it, are easier to enact; policies that increase it
                are more difficult. A positive budget impact here means the
                policy reduces the deficit, after its annual cost is subtracted.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {REFERENCES.map((group) => (
              <div key={group.heading}>
                <h3 className="font-serif text-lg text-ink">{group.heading}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  {group.note}
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {group.entries.map((entry) => (
                    <li
                      key={entry.text}
                      className="text-[13px] leading-relaxed text-ink-subtle"
                    >
                      {entry.href ? (
                        <a
                          href={entry.href}
                          className="underline decoration-border-strong underline-offset-4 transition-colors hover:text-ink"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {entry.text}
                        </a>
                      ) : (
                        entry.text
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
