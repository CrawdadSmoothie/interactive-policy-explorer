import { Explorer } from "@/components/Explorer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { dataset } from "@/lib/dataset";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-base font-semibold tracking-tight text-ink">
              The Kennedy Forum
            </span>
            <span className="hidden h-4 w-px bg-border-strong sm:block" />
            <span className="hidden text-sm text-ink-muted sm:block">
              Policy Explorer
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 sm:px-8">
        <section className="py-12 sm:py-16 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            Interactive Policy Explorer
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            See how policy choices shape mental health and the economy.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Choose a policy area, adjust the inputs, and watch the projected
            impact unfold over the next thirty years.
          </p>
        </section>

        <Explorer />
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
