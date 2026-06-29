import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  Building2,
  CircleCheck,
  Clock,
  FileUp,
  Files,
  History,
  Inbox,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteLaudoButton } from "@/components/dashboard/delete-laudo-button";
import { db } from "@/db";
import { laudos, type Laudo } from "@/db/schema";
import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { statusConfig, type StatusGeral } from "@/lib/status";
import { slugifyPredio } from "@/lib/timeline";
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

function fluxoDoLaudo(status: string, engenheiro: boolean) {
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

function totalNcDe(l: Laudo): number {
  return (
    l.extracao?.equipamentos.reduce(
      (n, eq) => n + eq.naoConformidades.length,
      0,
    ) ?? 0
  );
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

  const ultima = rows[0] ?? null;
  // Fila = extrações ainda em andamento, exceto a última (que vira destaque).
  const fila = rows
    .slice(1)
    .filter((l) => l.status === "extraindo" || (engenheiro && l.status === "revisar"));

  // Arquivo por prédio: o nome do prédio aparece UMA vez, com as extrações
  // datadas embaixo (resolve a repetição). Mais recente primeiro dentro do grupo.
  const grupos = (() => {
    const map = new Map<string, { nome: string; laudos: Laudo[] }>();
    for (const l of rows) {
      const nome = l.extracao?.predio.nome || l.fileName;
      const key = slugifyPredio(nome) || l.id;
      const g = map.get(key) ?? { nome, laudos: [] };
      g.laudos.push(l);
      map.set(key, g);
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v }));
  })();

  // KPIs de topo (visão data-dense): total, publicados, em andamento, prédios.
  const kpis = {
    total: rows.length,
    publicados: rows.filter((l) => l.status === "publicado").length,
    andamento: rows.filter(
      (l) => l.status === "extraindo" || (engenheiro && l.status === "revisar"),
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
        <Button
          nativeButton={false}
          render={<Link href="/upload" />}
          className="h-10 px-3.5"
        >
          <FileUp className="size-4" strokeWidth={2.25} />
          Nova extração
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="surface-panel flex flex-col items-center gap-4 rounded-2xl border-dashed px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-green/20 text-brand-green-strong">
            <Inbox className="size-6" strokeWidth={1.75} />
          </span>
          <div className="space-y-1">
            <p className="font-semibold">Nenhum laudo ainda</p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Envie um PDF para transformar a inspecao em painel, lista de
              não-conformidades e resumo pronto para revisão.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/upload" />}>
            <FileUp className="size-4" strokeWidth={2.25} />
            Enviar primeiro laudo
          </Button>
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

      {/* Prédios com histórico */}
      {historico.length > 0 ? (
        <Secao
          titulo="Prédios com histórico"
          Icon={History}
          hint="Evolução das não-conformidades ao longo do tempo"
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {historico.map((h) => (
              <Link
                key={h.key}
                href={`/predios/${h.key}`}
                className="surface-panel group flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand-green-strong/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/35"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/25 ring-1 ring-brand-green-strong/15">
                  <History className="size-5 text-brand-green-strong" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
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
        </Secao>
      ) : null}

      {/* Última extração (destaque) */}
      {ultima ? (
        <Secao titulo="Última extração" Icon={Sparkles}>
          <CardLaudo laudo={ultima} engenheiro={engenheiro} destaque />
        </Secao>
      ) : null}

      {/* Fila / em andamento */}
      {fila.length > 0 ? (
        <Secao
          titulo="Em andamento"
          Icon={Clock}
          hint={`${fila.length} ${fila.length === 1 ? "extração" : "extrações"} aguardando`}
        >
          <ul className="flex flex-col gap-2.5">
            {fila.map((l) => (
              <li key={l.id}>
                <CardLaudo laudo={l} engenheiro={engenheiro} />
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}

      {/* Arquivo completo, por prédio */}
      {rows.length > 0 ? (
        <Secao titulo="Todos os laudos" Icon={Inbox} hint="Organizados por prédio">
          <div className="flex flex-col gap-6">
            {grupos.map((g) => (
              <div key={g.key} className="space-y-2.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="size-1.5 rounded-full bg-brand-green-strong" aria-hidden />
                  {g.nome}
                  <span className="text-xs font-normal text-muted-foreground">
                    {g.laudos.length} {g.laudos.length === 1 ? "laudo" : "laudos"}
                  </span>
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {g.laudos.map((l) => (
                    <li key={l.id}>
                      <CardLaudo laudo={l} engenheiro={engenheiro} semTitulo />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Secao>
      ) : null}
    </main>
  );
}

function Secao({
  titulo,
  Icon,
  hint,
  children,
}: {
  titulo: string;
  Icon: typeof History;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Icon className="size-4 text-brand-green-strong" strokeWidth={2.25} />
          {titulo}
        </h2>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </section>
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

/**
 * Card de um laudo. Usa o padrão "stretched link" (link absoluto cobrindo o
 * card) para o card inteiro ser clicável sem aninhar o botão de excluir dentro
 * de um <a> (HTML inválido). `semTitulo` esconde o nome do prédio (já mostrado
 * no cabeçalho do grupo); `destaque` usa um visual maior.
 */
function CardLaudo({
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
  const titulo = extracao?.predio.nome || laudo.fileName;
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
        variant="icon"
        className="relative z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}
