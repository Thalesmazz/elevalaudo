"use client";

import { useMemo, useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight, FileCheck2, FileClock, FilePen, Layers } from "lucide-react";

import { CardLaudo } from "@/components/dashboard/laudo-card";
import { Segmented } from "@/components/dashboard/segmented";
import type { Laudo } from "@/db/schema";
import { cn } from "@/lib/utils";

type AbaStatus = "todos" | "publicado" | "revisar" | "rascunho";

const ABAS: { valor: AbaStatus; label: string; Icon: typeof Layers }[] = [
  { valor: "todos", label: "Todos", Icon: Layers },
  { valor: "publicado", label: "Publicados", Icon: FileCheck2 },
  { valor: "revisar", label: "Aguardando revisão", Icon: FileClock },
  { valor: "rascunho", label: "Rascunhos", Icon: FilePen },
];

// "Aguardando revisão" é só `revisar` (não mistura com `extraindo`, senão
// quem clica esperando poder agir em tudo que está listado se frustra ao
// achar um item ainda em processamento). `extraindo` só aparece em "Todos".
function pertenceAba(status: string, aba: AbaStatus): boolean {
  if (aba === "todos") return true;
  return status === aba;
}

/**
 * Abas de status da lista "Meus laudos" — filtra em memória (volume por
 * usuário é baixo). O controle "Lista / Por empresa" na mesma linha reagrupa
 * o resultado por empresa (mesma lógica dos gráficos), sem mudar o filtro de
 * status.
 */
export function StatusTabs({
  rows,
  engenheiro,
  empresas,
}: {
  rows: Laudo[];
  engenheiro: boolean;
  empresas: { id: string; nome: string }[];
}) {
  const [aba, setAba] = useState<AbaStatus>("todos");
  const [grupo, setGrupo] = useState<"lista" | "empresa">("lista");

  const contagens = useMemo(() => {
    const c: Record<AbaStatus, number> = {
      todos: rows.length,
      publicado: 0,
      revisar: 0,
      rascunho: 0,
    };
    for (const l of rows) {
      if (l.status === "publicado") c.publicado += 1;
      else if (l.status === "revisar") c.revisar += 1;
      else if (l.status === "rascunho") c.rascunho += 1;
    }
    return c;
  }, [rows]);

  const filtrados = useMemo(
    () => rows.filter((l) => pertenceAba(l.status, aba)),
    [rows, aba],
  );

  const empresaNomeById = useMemo(
    () => new Map(empresas.map((e) => [e.id, e.nome])),
    [empresas],
  );

  // Agrupa os laudos filtrados por empresa (laudo sem empresa → "Sem empresa").
  const gruposEmpresa = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; laudos: Laudo[] }>();
    for (const l of filtrados) {
      const id = l.empresaId ?? "__sem__";
      const nome = l.empresaId
        ? (empresaNomeById.get(l.empresaId) ?? "Empresa")
        : "Sem empresa";
      const g = map.get(id) ?? { id, nome, laudos: [] };
      g.laudos.push(l);
      map.set(id, g);
    }
    return [...map.values()];
  }, [filtrados, empresaNomeById]);

  return (
    <Tabs.Root
      value={aba}
      onValueChange={(v) => setAba(v as AbaStatus)}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border">
        <Tabs.List className="relative flex flex-wrap gap-1">
          {ABAS.map(({ valor, label, Icon }) => (
            <Tabs.Tab
              key={valor}
              value={valor}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors",
                "hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/35",
                "data-[active]:text-foreground",
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.25} />
              {label}
              <span className="text-xs text-muted-foreground tabular-nums">
                {contagens[valor]}
              </span>
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) bg-brand-green-strong transition-all duration-300" />
        </Tabs.List>

        <Segmented
          value={grupo}
          onChange={setGrupo}
          options={[
            { value: "lista", label: "Lista" },
            { value: "empresa", label: "Por empresa" },
          ]}
          className="mb-1.5"
        />
      </div>

      <Tabs.Panel value={aba} className="relative">
        {filtrados.length === 0 ? (
          <div className="surface-panel rounded-2xl border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhum laudo nesta aba ainda.
          </div>
        ) : grupo === "lista" ? (
          <ul className="flex flex-col gap-2.5">
            {filtrados.map((l) => (
              <li key={l.id}>
                <CardLaudo laudo={l} engenheiro={engenheiro} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-4">
            {gruposEmpresa.map((g) => (
              <Collapsible.Root key={g.id} defaultOpen>
                <Collapsible.Trigger className="group/emp flex w-full items-center gap-2 rounded-lg py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/emp:rotate-90" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {g.nome}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {g.laudos.length}
                  </span>
                </Collapsible.Trigger>
                <Collapsible.Panel className="overflow-hidden">
                  <ul className="mt-2 flex flex-col gap-2.5 pl-6">
                    {g.laudos.map((l) => (
                      <li key={l.id}>
                        <CardLaudo laudo={l} engenheiro={engenheiro} />
                      </li>
                    ))}
                  </ul>
                </Collapsible.Panel>
              </Collapsible.Root>
            ))}
          </div>
        )}
      </Tabs.Panel>
    </Tabs.Root>
  );
}
