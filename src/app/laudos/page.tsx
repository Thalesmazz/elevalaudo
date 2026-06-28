import Link from "next/link";
import { desc } from "drizzle-orm";
import { ArrowRight, FileUp, History, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { laudos } from "@/db/schema";
import { statusConfig, type StatusGeral } from "@/lib/status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Estado do fluxo do laudo (extraindo → revisar → publicado). Diferente do RAG
// (statusGeral) — aqui é onde o laudo está no processo, não a gravidade.
const FLUXO: Record<string, { label: string; cls: string }> = {
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

export default async function LaudosPage() {
  const rows = await db.select().from(laudos).orderBy(desc(laudos.createdAt));

  // Prédios com histórico = ≥2 laudos publicados com a mesma predio_key (têm
  // "filme", não só "foto"). Vira atalho direto pra timeline (P5, ADR-007).
  const historico = (() => {
    const map = new Map<string, { nome: string; n: number; lastMs: number }>();
    for (const l of rows) {
      if (l.status !== "publicado" || !l.predioKey || !l.extracao) continue;
      const ms = l.createdAt.getTime();
      const cur = map.get(l.predioKey) ?? {
        nome: l.extracao.predio.nome,
        n: 0,
        lastMs: 0,
      };
      cur.n += 1;
      if (ms >= cur.lastMs) {
        cur.lastMs = ms;
        cur.nome = l.extracao.predio.nome;
      }
      map.set(l.predioKey, cur);
    }
    return [...map.entries()]
      .filter(([, v]) => v.n >= 2)
      .map(([key, v]) => ({ key, nome: v.nome, n: v.n }));
  })();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Meus laudos</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "laudo" : "laudos"} no total
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/upload" />}>
          <FileUp className="size-4" strokeWidth={2} />
          Enviar laudo
        </Button>
      </div>

      {historico.length > 0 ? (
        <section className="space-y-2.5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <History className="size-4" strokeWidth={2} />
            Prédios com histórico
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {historico.map((h) => (
              <Link
                key={h.key}
                href={`/predios/${h.key}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <History className="size-4.5 text-foreground" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {h.nome}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Ver histórico · {h.n} laudos no tempo
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Inbox className="size-7 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            Nenhum laudo ainda. Envie o primeiro PDF para começar.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((laudo) => {
            const fluxo = FLUXO[laudo.status] ?? {
              label: laudo.status,
              cls: "bg-muted text-muted-foreground ring-border",
            };
            const extracao = laudo.extracao;
            const titulo = extracao?.predio.nome || laudo.fileName;
            const totalNc =
              extracao?.equipamentos.reduce(
                (n, eq) => n + eq.naoConformidades.length,
                0,
              ) ?? 0;
            const rag = extracao?.statusGeral as StatusGeral | undefined;
            const ragCfg = rag ? statusConfig[rag] : null;

            return (
              <li key={laudo.id}>
                <Link
                  href={`/laudos/${laudo.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
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
                    <p className="truncate text-sm font-medium text-foreground">
                      {titulo}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {extracao?.dataInspecao
                        ? `Inspeção ${extracao.dataInspecao} · `
                        : ""}
                      {totalNc} {totalNc === 1 ? "não-conformidade" : "não-conformidades"}
                      {" · "}
                      enviado {laudo.createdAt.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
