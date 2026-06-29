"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, Check, X } from "lucide-react";

import { NcCharts, type NcPonto } from "@/components/dashboard/nc-charts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LaudoDaEmpresa } from "@/lib/empresas-db";

/**
 * Modal de gráficos sob demanda: lista os laudos da empresa como cards
 * selecionáveis e, com os escolhidos, renderiza os gráficos (barra/linha/pizza)
 * só dos selecionados. Diferente de "Meus laudos" (visão ampla) — aqui é o
 * recorte que o usuário monta na hora.
 *
 * O gatilho vem como `children` (o ícone na lateral), embrulhado no
 * Dialog.Trigger via `render`.
 */

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function GraphModal({
  empresaNome,
  laudos,
  children,
}: {
  empresaNome: string;
  laudos: LaudoDaEmpresa[];
  children: React.ReactNode;
}) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [verGraficos, setVerGraficos] = useState(false);

  // Só laudos com extração têm dados de NC para o gráfico.
  const comDados = useMemo(
    () => laudos.filter((l) => l.statusGeral !== null),
    [laudos],
  );

  const dados: NcPonto[] = useMemo(() => {
    return comDados
      .filter((l) => selecionados.has(l.id))
      .slice()
      .sort((a, b) => a.criadoEmIso.localeCompare(b.criadoEmIso))
      .map((l) => ({
        rotulo: l.dataInspecao || fmtData(l.extraidoEmIso ?? l.criadoEmIso),
        urgente: l.contagem.urgente,
        atencao: l.contagem.atencao,
        leve: l.contagem.leve,
        total: l.contagem.total,
      }));
  }, [comDados, selecionados]);

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setVerGraficos(false);
  }

  return (
    <Dialog.Root onOpenChange={(open) => !open && reset()}>
      <Dialog.Trigger render={children as React.ReactElement} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-sm font-semibold">
                {verGraficos ? "Gráficos" : "Selecionar extrações"}
              </Dialog.Title>
              <Dialog.Description className="truncate text-xs text-muted-foreground">
                {empresaNome}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {verGraficos ? (
            <div className="flex flex-col gap-3 p-5">
              <button
                type="button"
                onClick={() => setVerGraficos(false)}
                className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Voltar à seleção
              </button>
              <NcCharts data={dados} />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {comDados.length === 0 ? (
                  <p className="px-1 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma extração concluída ainda para esta empresa.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {comDados.map((l) => {
                      const sel = selecionados.has(l.id);
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => toggle(l.id)}
                            aria-pressed={sel}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                              sel
                                ? "border-foreground/30 bg-muted"
                                : "border-border hover:bg-muted/50",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-md border",
                                sel
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-input",
                              )}
                            >
                              {sel ? <Check className="size-3" strokeWidth={3} /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {l.titulo}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {l.elevadores.length > 0
                                  ? l.elevadores.join(" · ")
                                  : "Sem elevadores discriminados"}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                Inspeção {l.dataInspecao || "—"} · Extraído{" "}
                                {fmtData(l.extraidoEmIso ?? l.criadoEmIso)} ·{" "}
                                {l.contagem.total} NCs
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                <span className="text-xs text-muted-foreground">
                  {selecionados.size} selecionado
                  {selecionados.size === 1 ? "" : "s"}
                </span>
                <Button
                  type="button"
                  disabled={selecionados.size === 0}
                  onClick={() => setVerGraficos(true)}
                  className="h-9"
                >
                  Ver gráficos
                </Button>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
