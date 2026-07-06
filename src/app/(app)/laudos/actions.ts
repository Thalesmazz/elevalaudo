"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { processarLaudo } from "@/lib/ai/process";
import { getSessao } from "@/lib/auth/session";
import { deleteLaudoPdf } from "@/lib/blob";

export type ExcluirState = { erro?: string };

/**
 * Exclui uma extração (laudo): apaga o PDF do Blob e a linha do banco.
 * Só o dono da extração pode excluir (defesa: o `userId` precisa bater com a
 * sessão). Em sucesso, volta pra `/laudos`.
 */
export async function excluirLaudo(
  _prev: ExcluirState,
  formData: FormData,
): Promise<ExcluirState> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { erro: "Extração não informada." };

  const [laudo] = await db
    .select({ id: laudos.id, userId: laudos.userId, blobUrl: laudos.blobUrl })
    .from(laudos)
    .where(eq(laudos.id, id))
    .limit(1);

  if (!laudo) return { erro: "Extração não encontrada." };
  if (laudo.userId !== sessao.user.id) {
    return { erro: "Você não tem permissão para excluir esta extração." };
  }

  await deleteLaudoPdf(laudo.blobUrl);
  await db.delete(laudos).where(eq(laudos.id, id));

  revalidatePath("/laudos", "layout");
  revalidatePath("/");
  redirect("/laudos");
}

/**
 * Reprocessa um laudo cuja extração FALHOU (auditoria 2026-07): antes, o laudo
 * ficava preso em `extraindo` sem saída. Só o dono, e só com erro registrado —
 * laudo extraindo sem erro está em andamento, não se mexe.
 */
export async function reprocessarLaudo(formData: FormData): Promise<void> {
  const sessao = await getSessao();
  if (!sessao) return;

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return;

  const [laudo] = await db
    .select({
      id: laudos.id,
      userId: laudos.userId,
      status: laudos.status,
      erroExtracao: laudos.erroExtracao,
    })
    .from(laudos)
    .where(eq(laudos.id, id))
    .limit(1);

  if (!laudo || laudo.userId !== sessao.user.id) return;
  if (laudo.status !== "extraindo" || !laudo.erroExtracao) return;

  await db
    .update(laudos)
    .set({ erroExtracao: null })
    .where(eq(laudos.id, id));

  after(() => processarLaudo(id));
  revalidatePath(`/laudos/${id}`);
}
