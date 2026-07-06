import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DeleteLaudoButton } from "@/components/dashboard/delete-laudo-button";
import type { Laudo } from "@/db/schema";
import { statusConfig, type StatusGeral } from "@/lib/status";
import { cn } from "@/lib/utils";

// Estado do fluxo do laudo (rascunho | extraindo → revisar → publicado).
// Diferente do RAG (statusGeral) — aqui é onde o laudo está no processo, não
// a gravidade.
export const FLUXO: Record<string, { label: string; cls: string }> = {
  rascunho: {
    label: "Rascunho",
    cls: "bg-zinc-400/10 text-zinc-600 ring-zinc-400/25 dark:text-zinc-400",
  },
  extraindo: {
    label: "Extraindo",
    cls: "bg-muted text-muted-foreground ring-border",
  },
  revisar: {
    label: "Revisar",
    cls: "bg-amber-400/10 text-amber-700 ring-amber-500/25 dark:text-amber-400",
  },
  publicado: {
    label: "Publicado",
    cls: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
  },
};

export function fluxoDoLaudo(status: string, engenheiro: boolean) {
  if (status === "revisar" && !engenheiro) {
    return {
      label: "Extraído",
      cls: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
    };
  }

  return (
    FLUXO[status] ?? {
      label: status,
      cls: "bg-muted text-muted-foreground ring-border",
    }
  );
}

export function totalNcDe(l: Laudo): number {
  return (
    l.extracao?.equipamentos.reduce(
      (n, eq) => n + eq.naoConformidades.length,
      0,
    ) ?? 0
  );
}

/**
 * Card de um laudo. Usa o padrão "stretched link" (link absoluto cobrindo o
 * card) para o card inteiro ser clicável sem aninhar o botão de excluir dentro
 * de um <a> (HTML inválido). `semTitulo` esconde o nome do prédio (já mostrado
 * no cabeçalho do grupo); `destaque` usa um visual maior.
 */
export function CardLaudo({
  laudo,
  engenheiro,
  destaque = false,
  semTitulo = false,
}: {
  laudo: Laudo;
  engenheiro: boolean;
  destaque?: boolean;
  semTitulo?: boolean;
}) {
  const fluxo = fluxoDoLaudo(laudo.status, engenheiro);
  const extracao = laudo.extracao;
  const titulo = extracao?.predio.nome || laudo.fileName || "Rascunho sem título";
  const totalNc = totalNcDe(laudo);
  const rag = extracao?.statusGeral as StatusGeral | undefined;
  const ragCfg = rag ? statusConfig[rag] : null;

  return (
    <div
      className={cn(
        "surface-panel group relative flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand-green-strong/40 hover:shadow-md",
        destaque
          ? "border-brand-green-strong/30 bg-brand-green/10"
          : "border-border",
      )}
    >
      <Link
        href={`/laudos/${laudo.id}`}
        className="absolute inset-0 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/35"
        aria-label={`Abrir laudo ${titulo}`}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
              fluxo.cls,
            )}
          >
            {fluxo.label}
          </span>
          {ragCfg ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                ragCfg.accent,
              )}
            >
              <ragCfg.Icon className="size-3.5" strokeWidth={2.25} />
              {ragCfg.label}
            </span>
          ) : null}
        </div>
        {!semTitulo ? (
          <p
            className={cn(
              "truncate font-medium text-foreground",
              destaque ? "text-base" : "text-sm",
            )}
          >
            {titulo}
          </p>
        ) : null}
        <p className="truncate text-xs text-muted-foreground">
          {extracao?.dataInspecao ? `Inspeção ${extracao.dataInspecao} · ` : ""}
          {totalNc} {totalNc === 1 ? "não-conformidade" : "não-conformidades"}
          {" · "}
          enviado {laudo.createdAt.toLocaleDateString("pt-BR")}
        </p>
      </div>
      <DeleteLaudoButton
        id={laudo.id}
        publicado={laudo.status === "publicado"}
        temPdf={Boolean(laudo.blobUrl)}
        variant="icon"
        className="relative z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}
