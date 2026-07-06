"use client";

import { useState } from "react";
import Link from "next/link";
import { Collapsible } from "@base-ui/react/collapsible";
import { Building2, ChartColumn, ChevronRight, History } from "lucide-react";

import { GraphModal } from "@/components/graph-modal";
import { Segmented } from "@/components/dashboard/segmented";
import { cn } from "@/lib/utils";
import { agruparPorPredio } from "@/lib/predios";
import type { EmpresaComLaudos, LaudoDaEmpresa } from "@/lib/empresas-db";

/**
 * "Gráficos por prédio" da home com dois modos: "Todos os prédios" (lista plana,
 * como antes) e "Por empresa" (empresa → prédios dela, expansível). O modo por
 * empresa é a visão geral que substitui a árvore da lateral quando ela está
 * recolhida.
 *
 * `predios` vem pré-computado do server (inclui laudos sem empresa/legado).
 * `empresas` alimenta a visão hierárquica — só laudos com empresa entram nela;
 * um prédio órfão (sem empresa) aparece em "Todos" mas não em "Por empresa",
 * o que é correto: "Por empresa" é a lente empresa-scoped.
 */

export type PredioCardData = {
  key: string;
  nome: string;
  /** Laudos com dados de NC (entram no GraphModal). */
  laudos: LaudoDaEmpresa[];
  totalNc: number;
  temHistorico: boolean;
  predioKey: string | null;
  ultimaData: string | null;
};

/** Deriva os cards de prédio (só os com dados) de uma empresa. */
function empresaParaCards(empresa: EmpresaComLaudos): PredioCardData[] {
  return agruparPorPredio(empresa.laudos)
    .map((g) => {
      const comDados = g.laudos.filter((l) => l.statusGeral !== null);
      const recente = comDados[0] ?? null;
      return {
        key: g.key,
        nome: g.nome,
        laudos: comDados,
        totalNc: comDados.reduce((n, l) => n + l.contagem.total, 0),
        temHistorico: g.publicados >= 2,
        // slug === predioKey gravado no publish (mesma lógica da lateral).
        predioKey: g.publicados >= 2 ? g.key : null,
        ultimaData: recente?.dataInspecao ?? null,
      };
    })
    .filter((c) => c.laudos.length > 0);
}

export function GraficosPorPredio({
  predios,
  empresas,
}: {
  predios: PredioCardData[];
  empresas: EmpresaComLaudos[];
}) {
  const [view, setView] = useState<"todos" | "empresa">("todos");

  const empresasComCards = empresas.map((e) => ({
    id: e.id,
    nome: e.nome,
    cards: empresaParaCards(e),
  }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <ChartColumn className="size-4 text-brand-green-strong" strokeWidth={2.25} />
          Gráficos por prédio
        </h2>
        {/* Segmented control: todos / por empresa */}
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "todos", label: "Todos os prédios" },
            { value: "empresa", label: "Por empresa" },
          ]}
        />
      </div>

      {view === "todos" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {predios.map((data) => (
            <PredioCard key={data.key} data={data} />
          ))}
        </div>
      ) : empresasComCards.length === 0 ? (
        <p className="surface-panel rounded-2xl border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          Nenhuma empresa com extrações ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {empresasComCards.map((e) => (
            <Collapsible.Root key={e.id} defaultOpen className="surface-panel rounded-2xl">
              <Collapsible.Trigger className="group/emp flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/emp:rotate-90" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {e.nome}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {e.cards.length}{" "}
                  {e.cards.length === 1 ? "prédio" : "prédios"}
                </span>
              </Collapsible.Trigger>
              <Collapsible.Panel className="overflow-hidden">
                <div className="border-t border-border p-2">
                  {e.cards.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      Sem extrações com dados ainda.
                    </p>
                  ) : (
                    <div className="grid gap-2 lg:grid-cols-2">
                      {e.cards.map((data) => (
                        <PredioCard key={data.key} data={data} aninhado />
                      ))}
                    </div>
                  )}
                </div>
              </Collapsible.Panel>
            </Collapsible.Root>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Card de um prédio: abre o modal de gráficos (extrações do prédio) e, com ≥2
 * publicados, um atalho pro histórico/timeline. `aninhado` reduz a moldura
 * quando dentro de uma empresa (a empresa já é a superfície externa).
 */
function PredioCard({
  data,
  aninhado = false,
}: {
  data: PredioCardData;
  aninhado?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl p-2 transition-all hover:-translate-y-0.5 hover:border-brand-green-strong/40 hover:shadow-md",
        aninhado ? "border border-border bg-card/70" : "surface-panel",
      )}
    >
      <GraphModal
        empresaNome={data.nome}
        laudos={data.laudos}
        tituloGraficos={`Gráficos de ${data.nome}`}
        descricao={`${data.laudos.length} extração${data.laudos.length === 1 ? "" : "ões"} · ${data.totalNc} NCs`}
        initialView="graficos"
        defaultSelectedIds={data.laudos.map((l) => l.id)}
        emptyMessage="Nenhuma extração concluída ainda para este prédio."
      >
        <button
          type="button"
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/25 ring-1 ring-brand-green-strong/15">
            <Building2 className="size-5 text-brand-green-strong" strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{data.nome}</span>
            <span className="block text-xs text-muted-foreground">
              {data.laudos.length}{" "}
              {data.laudos.length === 1 ? "extração" : "extrações"} · {data.totalNc}{" "}
              NCs
              {data.ultimaData ? ` · última ${data.ultimaData}` : ""}
            </span>
          </span>
          <ChartColumn className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:scale-105" />
        </button>
      </GraphModal>

      {data.temHistorico && data.predioKey ? (
        <Link
          href={`/predios/${data.predioKey}`}
          aria-label={`Abrir histórico de ${data.nome}`}
          title={`Abrir histórico de ${data.nome}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <History className="size-4" strokeWidth={2.25} />
        </Link>
      ) : null}
    </div>
  );
}
