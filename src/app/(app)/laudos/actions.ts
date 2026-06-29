"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
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
