import { cn } from "@/lib/utils";
import { STATUS_ORDER, statusConfig, type StatusGeral } from "@/lib/status";

type StatusHeroProps = {
  status: StatusGeral;
  predio: string;
  totalNc: number;
  urgentes: number;
  equipamentos: number;
  dataInspecao?: string;
};

/**
 * Hero do dashboard (P3 `dashboard-semaforo-hero`).
 *
 * Semáforo RAG glanceable: o síndico lê o status em ~2s, sem legenda. As três
 * lâmpadas ficam sempre visíveis (verde/amarelo/vermelho nas posições fixas) —
 * é a própria legenda. Só a ativa acende e respira.
 *
 * Leitura do laudo, não atestado de segurança (ADR-002). A validação é a
 * revisão + assinatura do responsável técnico (P2).
 */
export function StatusHero({
  status,
  predio,
  totalNc,
  urgentes,
  equipamentos,
  dataInspecao,
}: StatusHeroProps) {
  const active = statusConfig[status];

  const countLine =
    totalNc === 0
      ? "Nenhuma não-conformidade apontada"
      : [
          `${totalNc} não-${totalNc === 1 ? "conformidade" : "conformidades"}`,
          urgentes > 0
            ? `${urgentes} urgente${urgentes === 1 ? "" : "s"}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <section
      aria-label={`Status do laudo: ${active.label}`}
      className="relative overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* brilho do status sangrando do fundo — reforça a cor sem virar enfeite */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -right-16 size-72 rounded-full opacity-20 blur-3xl",
          active.lampOn,
        )}
      />

      <div className="relative flex flex-col gap-8 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-10">
        {/* semáforo */}
        <div className="flex shrink-0 flex-col gap-4 rounded-[1.75rem] bg-zinc-900 p-4 ring-1 ring-inset ring-white/10 dark:bg-zinc-950">
          {STATUS_ORDER.map((s) => {
            const lamp = statusConfig[s];
            const on = s === status;
            return (
              <span
                key={s}
                aria-hidden
                className={cn(
                  "size-14 rounded-full transition-opacity sm:size-16",
                  on
                    ? cn(lamp.lampOn, "status-lamp-on")
                    : cn(lamp.lampDim, "opacity-60"),
                )}
              />
            );
          })}
        </div>

        {/* leitura */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Status do laudo
          </p>

          <div className="mt-2 flex items-center gap-3">
            <active.Icon
              className={cn("size-8 sm:size-9", active.accent)}
              strokeWidth={2}
            />
            <h1
              className={cn(
                "text-5xl font-semibold tracking-tighter sm:text-7xl",
                active.accent,
              )}
            >
              {active.label}
            </h1>
          </div>

          <p className="mt-3 text-lg text-foreground/80 sm:text-xl">
            {active.message}
          </p>

          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {countLine}
            {equipamentos > 0
              ? ` · ${equipamentos} equipamento${equipamentos === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
      </div>

      {/* rodapé: contexto + nota de liability, fora do "momento" do hero */}
      <div className="relative flex flex-col gap-1 border-t border-border px-6 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <span className="truncate font-medium text-foreground/70">{predio}</span>
        <span>
          {dataInspecao ? `Inspeção em ${dataInspecao} · ` : ""}
          Leitura do laudo, não atestado de segurança.
        </span>
      </div>
    </section>
  );
}
