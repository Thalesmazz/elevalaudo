import { FileUp } from "lucide-react";

export default function LoadingLaudos() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-3">
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="flex h-10 items-center gap-2 rounded-lg bg-primary/60 px-3.5 text-sm font-semibold text-primary-foreground">
          <FileUp className="size-4" strokeWidth={2.25} />
          Nova extração
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="surface-panel min-h-28 animate-pulse rounded-2xl p-4"
          >
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-8 h-9 w-14 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-5 w-44 animate-pulse rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="surface-panel h-20 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    </main>
  );
}
