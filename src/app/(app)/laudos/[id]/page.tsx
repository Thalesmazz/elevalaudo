import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Download, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusHero } from "@/components/dashboard/status-hero";
import { NcList } from "@/components/dashboard/nc-list";
import { ComplianceSeal } from "@/components/dashboard/compliance-seal";
import { BrandHeader } from "@/components/dashboard/brand-header";
import { LaudoChat } from "@/components/dashboard/laudo-chat";
import { DeleteLaudoButton } from "@/components/dashboard/delete-laudo-button";
import { db } from "@/db";
import { laudos } from "@/db/schema";
import { getBranding } from "@/lib/branding";
import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { sharePath } from "@/lib/share";
import { slugifyPredio } from "@/lib/timeline";
import { contarPublicadosDoPredios } from "@/lib/timeline-db";
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

export default async function LaudoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [laudo] = await db.select().from(laudos).where(eq(laudos.id, id));
  if (!laudo) notFound();

  const sessao = await getSessao();
  const engenheiro = sessao ? isEngenheiro(sessao.user.role) : false;

  const branding = await getBranding();
  const status = STATUS_LABEL[laudo.status] ?? {
    label: laudo.status,
    hint: "",
  };
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
    ? await contarPublicadosDoPredios(predioKey)
    : 0;
  const temHistorico = predioKey !== null && laudosDoPredios >= 2;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      {laudo.status === "extraindo" ? <AutoRefresh /> : null}

      <BrandHeader branding={branding} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Laudo
          </p>
          <h1 className="text-xl font-semibold tracking-tight break-all">
            {laudo.fileName}
          </h1>
        </div>
        <DeleteLaudoButton
          id={laudo.id}
          publicado={laudo.status === "publicado"}
          variant="icon"
          className="mt-0.5 shrink-0"
        />
      </div>

      <div className="rounded-lg border border-input p-4">
        <p className="text-sm font-medium">{status.label}</p>
        {status.hint ? (
          <p className="mt-1 text-sm text-muted-foreground">{status.hint}</p>
        ) : null}
        {laudo.erroExtracao ? (
          <p className="mt-2 text-sm text-red-600">
            Falha na extração: {laudo.erroExtracao}
          </p>
        ) : null}
      </div>

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
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <History className="size-4.5 text-foreground" strokeWidth={2} />
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

      {laudo.status === "revisar" && engenheiro ? (
        <Button
          nativeButton={false}
          render={<Link href={`/laudos/${id}/revisar`} />}
        >
          Revisar e assinar
        </Button>
      ) : null}

      {laudo.status === "revisar" && !engenheiro ? (
        <p className="rounded-lg border border-input bg-muted/40 p-4 text-sm text-muted-foreground">
          Esta extração ainda aguarda revisão e assinatura do engenheiro
          responsável antes de ser publicada.
        </p>
      ) : null}

      {laudo.status === "publicado" ? (
        <div className="space-y-3 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900">
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
            <div className="space-y-1 border-t border-green-300 pt-3">
              <p className="font-medium">Link público para o síndico</p>
              <p className="text-green-800/80">
                Sem login — quem tem o link vê o laudo. Mande no WhatsApp.
              </p>
              <a
                href={sharePath(laudo.shareToken)}
                className="block truncate font-mono text-xs break-all text-green-900 underline"
              >
                {sharePath(laudo.shareToken)}
              </a>
              <a
                href={`${sharePath(laudo.shareToken)}/pdf`}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-900 transition-colors hover:bg-green-100"
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
