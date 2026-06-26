import { BookMarked, Clock, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";
import { severidadeConfig } from "@/lib/status";
import type { Equipamento, NaoConformidade } from "@/lib/schema/laudo";

/**
 * Lista de não-conformidades rankeada (P3 `dashboard-nc-ranked`).
 *
 * Ordena urgente → atenção → leve (o que importa primeiro fica no topo). Cada
 * NC traz o badge de severidade (reusa `severidadeConfig` do hero) e o item da
 * NBR 16858, quando o laudo cita. A barra lateral colorida dá o ranking visual.
 *
 * Leitura principal = `plainPt` (PT de gente, modo síndico); a `descricao`
 * técnica fica secundária. Rodapé traz a `acao` corretiva e o `prazo` do laudo
 * (prazo só quando informado — nunca estimado, ADR-003).
 */

const RANK: Record<NaoConformidade["severidade"], number> = {
  urgente: 0,
  atencao: 1,
  leve: 2,
};

const ACCENT: Record<NaoConformidade["severidade"], string> = {
  urgente: "border-l-red-500",
  atencao: "border-l-amber-400",
  leve: "border-l-zinc-300 dark:border-l-zinc-600",
};

type RankedNc = NaoConformidade & { equipamento: string };

export function NcList({ equipamentos }: { equipamentos: Equipamento[] }) {
  const ncs: RankedNc[] = equipamentos
    .flatMap((eq) =>
      eq.naoConformidades.map((nc) => ({
        ...nc,
        equipamento: eq.identificacao,
      })),
    )
    .sort((a, b) => RANK[a.severidade] - RANK[b.severidade]);

  if (ncs.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma não-conformidade apontada no laudo.
      </section>
    );
  }

  const multiEquip = equipamentos.length > 1;

  return (
    <section aria-label="Não-conformidades">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          Não-conformidades
        </h2>
        <span className="font-mono text-sm text-muted-foreground">
          {ncs.length} no total
        </span>
      </div>

      <ol className="flex flex-col gap-3">
        {ncs.map((nc, i) => {
          const sev = severidadeConfig[nc.severidade];
          return (
            <li
              key={i}
              className={cn(
                "rounded-xl border border-l-4 border-border bg-card p-4 sm:p-5",
                ACCENT[nc.severidade],
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                    sev.pill,
                  )}
                >
                  <sev.Icon className="size-3.5" strokeWidth={2.25} />
                  {sev.label}
                </span>

                {nc.itemNbr ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                    <BookMarked className="size-3.5" strokeWidth={2} />
                    {nc.itemNbr}
                  </span>
                ) : null}

                {multiEquip ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {nc.equipamento}
                  </span>
                ) : null}
              </div>

              {/* Modo síndico: o plain-PT é a leitura principal (zero jargão).
                  A descrição técnica do laudo fica secundária (vira o "modo
                  técnico" no toggle do P5). */}
              <p className="mt-2.5 text-base leading-relaxed font-medium text-foreground">
                {nc.plainPt?.trim() || nc.descricao}
              </p>

              {nc.plainPt?.trim() ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium">No laudo: </span>
                  {nc.descricao}
                </p>
              ) : null}

              {/* Ação corretiva + prazo (campos `acao`/`prazo` do laudo). Prazo
                  só aparece se o laudo informa — nunca estimamos (ADR-003). */}
              <div className="mt-3.5 flex flex-wrap items-start justify-between gap-3 border-t border-border pt-3">
                <p className="flex items-start gap-2 text-sm text-foreground/90">
                  <Wrench
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <span>
                    <span className="font-medium">O que fazer: </span>
                    {nc.acao}
                  </span>
                </p>

                {nc.prazo ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                      nc.severidade === "urgente"
                        ? severidadeConfig.urgente.pill
                        : "bg-muted text-muted-foreground ring-transparent",
                    )}
                  >
                    <Clock className="size-3.5" strokeWidth={2.25} />
                    Prazo: {nc.prazo}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
