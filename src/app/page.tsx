import { Explorer } from "@/components/Explorer";
import { Methodology } from "@/components/Methodology";
import { ThemeToggle } from "@/components/ThemeToggle";
import { dataset } from "@/lib/dataset";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            {/* Stacked lockup, so it needs more height than the single line of
                type it replaces to keep "THE" legible. */}
            <span
              role="img"
              aria-label="The Kennedy Forum"
              className="brand-logo block aspect-[669/175] h-9 shrink-0 sm:h-10"
            />
            <span className="hidden h-6 w-px bg-border-strong sm:block" />
            <span className="hidden text-sm text-ink-muted sm:block">
              Policy Explorer
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-14 sm:px-8">
        <section className="pb-6 pt-7 sm:pb-8 sm:pt-10">
          <h1 className="max-w-2xl font-serif text-[1.6rem] leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
            See how policy choices shape mental health and the economy.
          </h1>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Adjust the inputs and watch the projected impact unfold over the
            federal budget window.
          </p>
        </section>

        <Explorer />

        <Methodology />
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="max-w-2xl leading-relaxed">{dataset.meta.disclaimer}</p>
          <p className="shrink-0 font-medium uppercase tracking-[0.12em]">
            {dataset.meta.dataQuality === "illustrative"
              ? "Illustrative data"
              : "Source data"}
          </p>
        </div>
      </footer>
    </div>
  );
}
