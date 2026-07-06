import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { getSessao } from "@/lib/auth/session";
import { podeEditarLaudo } from "@/lib/auth/roles";
import { LaudoForm } from "@/components/dashboard/laudo-form";

export default async function EditarLaudoManualPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // RBAC: só o engenheiro monta/edita laudo manual (liability, ADR-002).
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  if (!podeEditarLaudo(sessao.user.role)) redirect(`/laudos/${id}`);

  const [laudo] = await db.select().from(laudos).where(eq(laudos.id, id));
  if (!laudo) notFound();
  if (laudo.userId !== sessao.user.id) notFound();

  // Só dá pra continuar montando o que ainda é rascunho.
  if (laudo.status !== "rascunho") redirect(`/laudos/${id}`);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <LaudoForm
        id={id}
        inicial={laudo.extracao}
        modo="manual"
        temPdfOriginal={false}
      />
    </main>
  );
}
