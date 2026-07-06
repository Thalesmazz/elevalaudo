import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download, History, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusHero } from "@/components/dashboard/status-hero";
import { NcList } from "@/components/dashboard/nc-list";
import { ComplianceSeal } from "@/components/dashboard/compliance-seal";
import { BrandHeader } from "@/components/dashboard/brand-header";
import { LaudoChat } from "@/components/dashboard/laudo-chat";
import { DeleteLaudoButton } from "@/components/dashboard/delete-laudo-button";
import { ExtractionLoading } from "@/components/dashboard/extraction-loading";
import { getBranding } from "@/lib/branding";
import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { getLaudoAcessivelPorUsuario } from "@/lib/laudo-access";
import { sharePath } from "@/lib/share";
import { slugifyPredio } from "@/lib/timeline";
import { contarPublicadosDoPredios } from "@/lib/timeline-db";
import { reprocessarLaudo } from "../actions";
import { AutoRefresh } from "./auto-refresh";

const STATUS_LABEL: Record<string, { label: string; hint: string }> = {
  extraindo: {
    label: "Extraindo",
    hint: "Lendo o PDF e estruturando os dados do laudo…",
  },
  revisar: {
    label: "Pronto para revisão",
    hint: "Extração concluída. Revise e assine antes de publicar.",
  },
  publicado: {
    label: "Publicado",
    hint: "Laudo revisado e assinado pelo responsável técnico.",
  },
};

function statusLabelDoLaudo({
  status,
  engenheiro,
  laudoProprio,
}: {
  status: string;
  engenheiro: boolean;
  laudoProprio: boolean;
}) {
  if (status === "revisar" && !engenheiro && laudoProprio) {
    return {
      label: "Extraído",
      hint: "Extração concluída. O laudo já está disponível para consulta e download.",
    };
  }

  if (status === "revisar" && !engenheiro) {
    return {
      label: "Recebido",
      hint: "Laudo publicado pelo engenheiro e disponível para consulta.",
    };
  }

  return STATUS_LABEL[status] ?? { label: status, hint: "" };
}

export default async function LaudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const acesso = await getLaudoAcessivelPorUsuario(id, sessao.user);
  if (!acesso) notFound();

  const { laudo } = acesso;
  const engenheiro = isEngenheiro(sessao.user.role);
  const laudoProprio = acesso.origem === "proprio";

  const branding = await getBranding();
  const status = statusLabelDoLaudo({
    status: laudo.status,
    engenheiro,
    laudoProprio,
  });
  const extracao = laudo.extracao;
  const totalNc =
    extracao?.equipamentos.reduce(
      (n, eq) => n + eq.naoConformidades.length,
      0,
    ) ?? 0;
  const urgentes =
    extracao?.equipamentos.reduce(
      (n, eq) =>
        n + eq.naoConformidades.filter((nc) => nc.severidade === "urgente").length,
      0,
    ) ?? 0;

  // Timeline multi-laudo (P5, ADR-007): a chave do prédio congela no publish;
  // pra laudo ainda em revisão, deriva do nome extraído só pra checar histórico.
  // Só oferece o link quando há ≥2 laudos PUBLICADOS do mesmo prédio (senão é
  // "foto", não "filme").
  const predioKey =
    laudo.predioKey ??
    (extracao ? slugifyPredio(extracao.predio.nome) : null);
  const laudosDoPredios = predioKey
    ? await contarPublicadosDoPredios(predioKey, sessao.user)
    : 0;
  const temHistorico = predioKey !== null && laudosDoPredios >= 2;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12">
      {laudo.status === "extraindo" && !laudo.erroExtracao ? (
        <AutoRefresh />
      ) : null}

      <BrandHeader branding={branding} />

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="min-w-0 space-y-1">
          <p className="text-kicker">
            Laudo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight break-all sm:text-3xl">
            {laudo.fileName}
          </h1>
          {extracao ? (
            <p className="text-sm text-muted-foreground">
              {extracao.predio.nome}
              {extracao.dataInspecao ? ` · Inspeção ${extracao.dataInspecao}` : ""}
            </p>
          ) : null}
        </div>
        {laudoProprio ? (
          <DeleteLaudoButton
            id={laudo.id}
            publicado={laudo.status === "publicado"}
            variant="icon"
            className="mt-0.5 shrink-0"
          />
        ) : null}
      </div>

      {laudo.status === "extraindo" && laudo.erroExtracao ? (
        // Extração falhou: sem isto o laudo ficava no spinner pra sempre
        // (o erro só aparecia depois de sair de `extraindo` — ou seja, nunca).
        <div className="surface-panel rounded-2xl p-4">
          <p className="text-sm font-semibold">Falha na extração</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Não conseguimos ler este PDF. Pode ser instabilidade momentânea —
            vale tentar de novo.
          </p>
          <p className="mt-2 text-sm text-red-600 break-words">
            {laudo.erroExtracao}
          </p>
          {laudoProprio ? (
            <form action={reprocessarLaudo} className="mt-3">
              <input type="hidden" name="id" value={laudo.id} />
              <Button type="submit" variant="outline" size="sm">
                <RotateCcw className="size-4" aria-hidden />
                Tentar novamente
              </Button>
            </form>
          ) : null}
        </div>
      ) : laudo.status === "extraindo" ? (
        <ExtractionLoading fileName={laudo.fileName} />
      ) : (
        <div className="surface-panel rounded-2xl p-4">
          <p className="text-sm font-semibold">{status.label}</p>
          {status.hint ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {status.hint}
            </p>
          ) : null}
          {laudo.erroExtracao ? (
            <p className="mt-2 text-sm text-red-600">
              Falha na extração: {laudo.erroExtracao}
            </p>
          ) : null}
        </div>
      )}

      {extracao ? (
        <>
          <StatusHero
            status={extracao.statusGeral}
            predio={extracao.predio.nome}
            totalNc={totalNc}
            urgentes={urgentes}
            equipamentos={extracao.equipamentos.length}
            dataInspecao={extracao.dataInspecao}
          />
          <NcList
            equipamentos={extracao.equipamentos}
            audiencia={engenheiro ? "tecnico" : "sindico"}
          />
          <ComplianceSeal
            dataInspecao={extracao.dataInspecao}
            endereco={extracao.predio.endereco}
          />
          {temHistorico && predioKey ? (
            <Link
              href={`/predios/${predioKey}`}
              className="surface-panel group flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand-green-strong/40 focus-visible:ring-3 focus-visible:ring-ring/35"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/20">
                <History className="size-5 text-brand-green-strong" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  Ver histórico do prédio
                </span>
                <span className="block text-xs text-muted-foreground">
                  {laudosDoPredios} laudos publicados — evolução das
                  não-conformidades no tempo
                </span>
              </span>
            </Link>
          ) : null}

          <LaudoChat api={`/api/laudos/${id}/chat`} />
        </>
      ) : null}

      {extracao ? (
        <Button
          nativeButton={false}
          render={<Link href={`/laudos/${id}/exportar`} />}
        >
          <Download className="size-4" strokeWidth={2.25} />
          Baixar PDF do laudo
        </Button>
      ) : null}

      {laudo.status === "revisar" && engenheiro ? (
        <Button
          nativeButton={false}
          render={<Link href={`/laudos/${id}/revisar`} />}
        >
          Revisar e assinar
        </Button>
      ) : null}

      {laudo.status === "publicado" ? (
        <div className="space-y-3 rounded-2xl border border-emerald-300/70 bg-emerald-50/90 p-4 text-sm text-emerald-950 shadow-sm">
          <div className="space-y-1">
            <p className="font-medium">Revisado e assinado</p>
            <p>
              {laudo.assinanteNome}
              {laudo.assinanteCrea ? ` · ${laudo.assinanteCrea}` : ""}
              {laudo.publicadoEm
                ? ` · ${laudo.publicadoEm.toLocaleDateString("pt-BR")}`
                : ""}
            </p>
          </div>
          {laudo.shareToken ? (
            <div className="space-y-1 border-t border-emerald-300/70 pt-3">
              <p className="font-medium">Link público para o síndico</p>
              <p className="text-emerald-900/75">
                Sem login — quem tem o link vê o laudo. Mande no WhatsApp.
              </p>
              <a
                href={sharePath(laudo.shareToken)}
                className="block truncate font-mono text-xs break-all text-emerald-950 underline underline-offset-4"
              >
                {sharePath(laudo.shareToken)}
              </a>
              <a
                href={`${sharePath(laudo.shareToken)}/pdf`}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-950 transition-colors hover:bg-emerald-100"
              >
                <Download className="size-3.5" strokeWidth={2} />
                Baixar PDF branded
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
