import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  PlusCircle,
} from "lucide-react";

import { BrandHeader } from "@/components/dashboard/brand-header";
import { NcCharts, type NcPonto } from "@/components/dashboard/nc-charts";
import { getBranding } from "@/lib/branding";
import { getSessao } from "@/lib/auth/session";
import { statusConfig } from "@/lib/status";
import { compararPontos, type MudancaNc } from "@/lib/timeline";
import { getTimelinePredio } from "@/lib/timeline-db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MUDANCA_UI: Record<
  MudancaNc["tipo"],
  { label: string; Icon: typeof PlusCircle; cls: string }
> = {
  nova: {
    label: "Nova",
    Icon: PlusCircle,
    cls: "text-red-700 dark:text-red-400",
  },
  agravada: {
    label: "Agravou",
    Icon: ArrowUpRight,
    cls: "text-red-700 dark:text-red-400",
  },
  resolvida: {
    label: "Resolvida",
    Icon: CheckCircle2,
    cls: "text-emerald-700 dark:text-emerald-400",
  },
  amenizada: {
    label: "Melhorou",
    Icon: ArrowDownRight,
    cls: "text-emerald-700 dark:text-emerald-400",
  },
};

export default async function PredioTimelinePage({
  params,
}: {
  params: Promise<{ predioKey: string }>;
}) {
  const { predioKey } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const timeline = await getTimelinePredio(predioKey, sessao.user);
  if (!timeline) notFound();

  const branding = await getBranding();
  const { pontos, predioNome } = timeline;

  // Dados pro gráfico de NCs por inspeção. NcCharts traz o seletor de tipo
  // (barra/linha/pizza) e a paleta RAG — reaproveitado da timeline do prédio.
  const chartData: NcPonto[] = pontos.map((p) => ({
    rotulo: p.dataCurta,
    urgente: p.contagem.urgente,
    atencao: p.contagem.atencao,
    leve: p.contagem.leve,
    total: p.contagem.total,
  }));

  // Diff ano-a-ano (P5 `comparacao-ano-a-ano`): últimos dois laudos.
  const temComparacao = pontos.length >= 2;
  const anterior = temComparacao ? pontos[pontos.length - 2] : null;
  const atual = pontos[pontos.length - 1];
  const mudancas =
    anterior && atual ? compararPontos(anterior, atual) : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <BrandHeader branding={branding} />

      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Histórico do equipamento
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{predioNome}</h1>
        <p className="text-sm text-muted-foreground">
          {pontos.length} laudos publicados ·{" "}
          {timeline.equipamentos.length}{" "}
          {timeline.equipamentos.length === 1 ? "equipamento" : "equipamentos"} ·
          evolução das não-conformidades ao longo do tempo
        </p>
      </div>

      {/* Gráfico da evolução das NCs por severidade. */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">
            Não-conformidades por inspeção
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Legenda cor="#ef4444" label="Urgente" />
            <Legenda cor="#f59e0b" label="Atenção" />
            <Legenda cor="#a1a1aa" label="Leve" />
          </div>
        </div>
        <NcCharts data={chartData} />
      </section>

      {/* O que mudou desde o laudo anterior (comparação ano-a-ano). */}
      {temComparacao ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold tracking-tight">
            O que mudou desde o laudo anterior
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {anterior!.dataLabel} → {atual.dataLabel}
          </p>

          {mudancas.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhuma mudança nas não-conformidades entre os dois laudos.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {mudancas.map((m, i) => {
                const ui = MUDANCA_UI[m.tipo];
                return (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <ui.Icon
                      className={cn("mt-0.5 size-4 shrink-0", ui.cls)}
                      strokeWidth={2}
                    />
                    <span className="min-w-0">
                      <span className={cn("font-medium", ui.cls)}>
                        {ui.label}
                        {m.severidadeAnterior
                          ? ` (${m.severidadeAnterior} → ${m.severidade})`
                          : ""}
                        :
                      </span>{" "}
                      <span className="text-foreground/90">
                        {m.plainPt?.trim() || m.descricao}
                      </span>
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                        {m.equipamento}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {/* Linha do tempo dos laudos (mais recente no topo). */}
      <section>
        <h2 className="mb-4 text-base font-semibold tracking-tight">
          Linha do tempo
        </h2>
        <ol className="relative flex flex-col gap-3 border-l border-border pl-6">
          {[...pontos].reverse().map((p) => {
            const st = statusConfig[p.statusGeral];
            const href = p.shareToken
              ? `/r/${p.shareToken}`
              : `/laudos/${p.laudoId}`;
            return (
              <li key={p.laudoId} className="relative">
                <span
                  className={cn(
                    "absolute top-5 -left-[1.92rem] size-3 rounded-full ring-4 ring-background",
                    st.lampOn,
                  )}
                  aria-hidden
                />
                <Link
                  href={href}
                  className="group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <Clock
                      className="size-3.5 text-muted-foreground"
                      strokeWidth={2}
                    />
                    {p.dataLabel}
                    {p.dataEstimada ? (
                      <span className="text-xs text-muted-foreground">
                        (publicação)
                      </span>
                    ) : null}
                  </span>
                  <span className={cn("text-sm font-medium", st.accent)}>
                    {st.label}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.contagem.total}{" "}
                    {p.contagem.total === 1 ? "NC" : "NCs"}
                    {p.contagem.urgente > 0
                      ? ` · ${p.contagem.urgente} urgente${p.contagem.urgente > 1 ? "s" : ""}`
                      : ""}
                  </span>
                  <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-[3px]"
        style={{ background: cor }}
      />
      {label}
    </span>
  );
}
