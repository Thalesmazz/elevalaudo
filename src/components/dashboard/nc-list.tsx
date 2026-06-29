"use client";

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
 * Linguagem fixada pelo papel do login (sem toggle): **Síndico/Administração** =
 * `plainPt` (PT de gente, zero jargão) em primeiro plano, com a descrição do
 * laudo como apoio. **Engenheiro** = `descricao` do laudo em primeiro plano
 * (jargão + item NBR em destaque), com o plain-PT como apoio. Os dois textos já
 * vêm no dado; a `audiencia` (derivada do papel) só escolhe qual fica em primeiro
 * plano — o leigo não precisa virar chave nenhuma pra "técnico".
 *
 * Rodapé traz a `acao` corretiva e o `prazo` do laudo (prazo só quando
 * informado — nunca estimado, ADR-003).
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

type ViewMode = "sindico" | "tecnico";

type RankedNc = NaoConformidade & { equipamento: string };

export function NcList({
  equipamentos,
  audiencia = "sindico",
}: {
  equipamentos: Equipamento[];
  /** Linguagem — fixada pelo papel no login (engenheiro=técnico, demais=síndico). */
  audiencia?: ViewMode;
}) {
  const tecnico = audiencia === "tecnico";

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
      <section className="surface-panel rounded-2xl p-6 text-sm text-muted-foreground">
        Nenhuma não-conformidade apontada no laudo.
      </section>
    );
  }

  const multiEquip = equipamentos.length > 1;

  return (
    <section aria-label="Não-conformidades">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          Não-conformidades
        </h2>
        <span className="font-mono text-sm text-muted-foreground">
          {ncs.length} no total
        </span>
      </div>

      <ol className="flex flex-col gap-3">
        {ncs.map((nc, i) => {
          const sev = severidadeConfig[nc.severidade];
          const hasPlain = !!nc.plainPt?.trim();
          // Texto principal segue o modo: técnico = descrição do laudo; síndico =
          // plain-PT (com fallback pra descrição quando o laudo não tem resumo).
          const primary = tecnico
            ? nc.descricao
            : nc.plainPt?.trim() || nc.descricao;
          return (
            <li
              key={i}
              className={cn(
                "surface-panel rounded-2xl border-l-4 p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/15 sm:p-5",
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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs",
                      // No modo técnico o item da NBR vira referência de destaque.
                      tecnico
                        ? "bg-foreground/10 text-foreground ring-1 ring-inset ring-border"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
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

              {/* Leitura principal conforme o toggle. */}
              <p className="mt-2.5 text-base leading-relaxed font-medium text-foreground">
                {primary}
              </p>

              {/* Leitura de apoio: a outra forma do mesmo problema. Só quando há
                  plain-PT (senão os dois textos seriam iguais). */}
              {hasPlain ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium">
                    {tecnico ? "Em PT de gente: " : "No laudo: "}
                  </span>
                  {tecnico ? nc.plainPt : nc.descricao}
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
                      // sem shrink-0 + quebra de linha: prazo longo (ex. frase do
                      // laudo) não estoura o card, vira "tag" que envolve o texto.
                      "inline-flex max-w-full items-start gap-1.5 rounded-2xl px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                      nc.severidade === "urgente"
                        ? severidadeConfig.urgente.pill
                        : "bg-muted text-muted-foreground ring-transparent",
                    )}
                  >
                    <Clock
                      className="mt-px size-3.5 shrink-0"
                      strokeWidth={2.25}
                    />
                    <span className="min-w-0 break-words">
                      Prazo: {nc.prazo}
                    </span>
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
