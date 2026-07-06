"use client";

import { cn } from "@/lib/utils";

/**
 * Controle segmentado (pílula) — usado pra alternar "Todos / Por empresa" nos
 * gráficos e na lista de laudos. Estilo único pra manter os dois consistentes.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-card/60 p-0.5 text-xs font-medium",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring/35",
            value === o.value
              ? "bg-brand-green/25 text-brand-green-strong"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
