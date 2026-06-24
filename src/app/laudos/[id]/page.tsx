import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { AutoRefresh } from "./auto-refresh";

const STATUS_LABEL: Record<string, { label: string; hint: string }> = {
  extraindo: {
    label: "Extraindo",
    hint: "Lendo o PDF e estruturando os dados do laudo…",
  },
  revisar: {
    label: "Pronto para revisão",
    hint: "Extração concluída. Revise e assine antes de publicar (P2).",
  },
  publicado: {
    label: "Publicado",
    hint: "Laudo revisado e disponível no link público.",
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

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
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
        <div className="space-y-2 rounded-lg border border-input p-4 text-sm">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Extração (rascunho — dashboard vem no P3)
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Prédio</dt>
            <dd>{extracao.predio.nome}</dd>
            <dt className="text-muted-foreground">Responsável</dt>
            <dd>
              {extracao.produtor.nome}
              {extracao.produtor.crea ? ` · CREA ${extracao.produtor.crea}` : ""}
            </dd>
            <dt className="text-muted-foreground">Status geral</dt>
            <dd>{extracao.statusGeral}</dd>
            <dt className="text-muted-foreground">Equipamentos</dt>
            <dd>{extracao.equipamentos.length}</dd>
            <dt className="text-muted-foreground">Não-conformidades</dt>
            <dd>{totalNc}</dd>
          </dl>
        </div>
      ) : null}
    </main>
  );
}
