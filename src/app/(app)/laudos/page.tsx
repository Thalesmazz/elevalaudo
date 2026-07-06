import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  Building2,
  CircleCheck,
  Clock,
  FilePen,
  FileUp,
  Files,
  Inbox,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GraficosPorPredio,
  type PredioCardData,
} from "@/components/dashboard/graficos-por-predio";
import { db } from "@/db";
import { laudos, type Laudo } from "@/db/schema";
import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { getEmpresasDoUsuario, type LaudoDaEmpresa } from "@/lib/empresas-db";
import { slugifyPredio } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import { StatusTabs } from "./status-tabs";

export const dynamic = "force-dynamic";

function contagemNcDe(l: Laudo): LaudoDaEmpresa["contagem"] {
  const c = { urgente: 0, atencao: 0, leve: 0, total: 0 };
  for (const eq of l.extracao?.equipamentos ?? []) {
    for (const nc of eq.naoConformidades) {
      c[nc.severidade] += 1;
      c.total += 1;
    }
  }
  return c;
}

function laudoParaGrafico(l: Laudo): LaudoDaEmpresa {
  const ex = l.extracao;
  return {
    id: l.id,
    status: l.status,
    titulo: ex?.predio.nome || l.fileName || "Rascunho sem título",
    elevadores: ex?.equipamentos.map((e) => e.identificacao) ?? [],
    dataInspecao: ex?.dataInspecao ?? null,
    statusGeral: ex?.statusGeral ?? null,
    contagem: contagemNcDe(l),
    extraidoEmIso: l.extraidoEm ? l.extraidoEm.toISOString() : null,
    criadoEmIso: l.createdAt.toISOString(),
  };
}

export default async function LaudosPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  const engenheiro = isEngenheiro(sessao.user.role);

  const rows = await db
    .select()
    .from(laudos)
    .where(eq(laudos.userId, sessao.user.id))
    .orderBy(desc(laudos.createdAt));

  // Empresas → laudos: alimenta a visão "Por empresa" dos gráficos. Só traz
  // laudos COM empresa (os órfãos/legados seguem só no flat, montado de `rows`).
  const empresas = await getEmpresasDoUsuario(sessao.user.id);

  // Arquivo por prédio: o nome do prédio aparece UMA vez, com as extrações
  // datadas embaixo (resolve a repetição). Mais recente primeiro dentro do grupo.
  const grupos = (() => {
    const map = new Map<string, { nome: string; laudos: Laudo[] }>();
    for (const l of rows) {
      const nome = l.extracao?.predio.nome || l.fileName || "Rascunho sem título";
      const key = slugifyPredio(nome) || l.id;
      const g = map.get(key) ?? { nome, laudos: [] };
      g.laudos.push(l);
      map.set(key, g);
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v }));
  })();

  const prediosComGraficos = grupos
    .map((g) => {
      const laudosGrafico = g.laudos
        .filter((l) => l.extracao)
        .map(laudoParaGrafico);
      const publicados = g.laudos.filter(
        (l) => l.status === "publicado" && l.predioKey,
      );
      const totalNc = laudosGrafico.reduce((n, l) => n + l.contagem.total, 0);
      const recente = laudosGrafico[0] ?? null;
      return {
        ...g,
        laudosGrafico,
        publicados,
        totalNc,
        recente,
      };
    })
    .filter((g) => g.laudosGrafico.length > 0);

  // Achata os grupos de prédio pro shape serializável do componente client
  // (colapsa o `publicados: Laudo[]` server-only numa string de predioKey).
  const prediosCardData: PredioCardData[] = prediosComGraficos.map((g) => ({
    key: g.key,
    nome: g.nome,
    laudos: g.laudosGrafico,
    totalNc: g.totalNc,
    temHistorico: g.publicados.length >= 2,
    predioKey: g.publicados[0]?.predioKey ?? null,
    ultimaData: g.recente?.dataInspecao ?? null,
  }));

  // KPIs de topo (visão data-dense): total, publicados, em andamento, prédios.
  const kpis = {
    total: rows.length,
    publicados: rows.filter((l) => l.status === "publicado").length,
    andamento: rows.filter(
      (l) =>
        l.status === "extraindo" ||
        l.status === "rascunho" ||
        (engenheiro && l.status === "revisar"),
    ).length,
    predios: grupos.length,
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-12">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <p className="text-kicker">Operação de laudos</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Meus laudos
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {rows.length} {rows.length === 1 ? "laudo" : "laudos"} no total
            {rows.length > 0
              ? " com status, histórico e revisão em um só lugar."
              : ". Envie o primeiro PDF para montar o painel."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {engenheiro ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/laudos/novo" />}
              className="h-10 px-3.5"
            >
              <FilePen className="size-4" strokeWidth={2.25} />
              Novo laudo
            </Button>
          ) : null}
          <Button
            nativeButton={false}
            render={<Link href="/upload" />}
            className="h-10 px-3.5"
          >
            <FileUp className="size-4" strokeWidth={2.25} />
            Nova extração
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="surface-panel flex flex-col items-center gap-4 rounded-2xl border-dashed px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-green/20 text-brand-green-strong">
            <Inbox className="size-6" strokeWidth={1.75} />
          </span>
          <div className="space-y-1">
            <p className="font-semibold">Nenhum laudo ainda</p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Envie um PDF para transformar a inspeção em painel, lista de
              não-conformidades e resumo pronto para revisão.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button nativeButton={false} render={<Link href="/upload" />}>
              <FileUp className="size-4" strokeWidth={2.25} />
              Enviar primeiro laudo
            </Button>
            {engenheiro ? (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/laudos/novo" />}
              >
                <FilePen className="size-4" strokeWidth={2.25} />
                ou monte um laudo manualmente
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi Icon={Files} valor={kpis.total} label="Laudos" />
          <Kpi
            Icon={CircleCheck}
            valor={kpis.publicados}
            label="Publicados"
            destaque
          />
          <Kpi Icon={Clock} valor={kpis.andamento} label="Em andamento" />
          <Kpi Icon={Building2} valor={kpis.predios} label="Prédios" />
        </div>
      )}

      {/* Gráficos por prédio — flat "Todos" ou hierarquia "Por empresa" */}
      {prediosComGraficos.length > 0 ? (
        <GraficosPorPredio predios={prediosCardData} empresas={empresas} />
      ) : null}

      {/* Status: Todos / Publicados / Aguardando revisão / Rascunhos */}
      {rows.length > 0 ? (
        <StatusTabs
          rows={rows}
          engenheiro={engenheiro}
          empresas={empresas.map((e) => ({ id: e.id, nome: e.nome }))}
        />
      ) : null}
    </main>
  );
}

/** Card de KPI (faixa de métricas no topo — padrão data-dense). */
function Kpi({
  Icon,
  valor,
  label,
  destaque = false,
}: {
  Icon: typeof Files;
  valor: number;
  label: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-panel flex min-h-28 flex-col justify-between gap-2 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/15",
        destaque
          ? "border-brand-green-strong/30 bg-brand-green/10"
          : "border-border bg-card/90",
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon
          className={cn(
            "size-3.5",
            destaque ? "text-brand-green-strong" : "text-muted-foreground",
          )}
          strokeWidth={2.25}
        />
        {label}
      </span>
      <span className="text-3xl font-semibold tracking-tight tabular-nums">
        {valor}
      </span>
    </div>
  );
}
