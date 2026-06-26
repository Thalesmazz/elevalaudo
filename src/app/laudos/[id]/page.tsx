import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusHero } from "@/components/dashboard/status-hero";
import { NcList } from "@/components/dashboard/nc-list";
import { ComplianceSeal } from "@/components/dashboard/compliance-seal";
import { db } from "@/db";
import { laudos } from "@/db/schema";
import { sharePath } from "@/lib/share";
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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      {laudo.status === "extraindo" ? <AutoRefresh /> : null}

      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Laudo
        </p>
        <h1 className="text-xl font-semibold tracking-tight break-all">
          {laudo.fileName}
        </h1>
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
          <NcList equipamentos={extracao.equipamentos} />
          <ComplianceSeal
            dataInspecao={extracao.dataInspecao}
            endereco={extracao.predio.endereco}
          />
        </>
      ) : null}

      {laudo.status === "revisar" ? (
        <Button
          nativeButton={false}
          render={<Link href={`/laudos/${id}/revisar`} />}
        >
          Revisar e assinar
        </Button>
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
