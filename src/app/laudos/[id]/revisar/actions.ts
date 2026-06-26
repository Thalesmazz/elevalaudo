"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { laudoSchema } from "@/lib/schema/laudo";
import { generateShareToken } from "@/lib/share";

export type AprovarInput = {
  id: string;
  extracao: unknown;
  assinanteNome: string;
  assinanteCrea: string;
  confirmado: boolean;
};

export type AprovarResultado = { erro?: string };

/**
 * Aprova/assina o laudo revisado e move pra `publicado` (P2, ADR-002).
 * Guardrail de liability: só publica com nome do responsável + confirmação,
 * e o conteúdo é re-validado pelo LaudoSchema no servidor (nunca confiar no
 * cliente). Não auto-certifica segurança — quem assina é o engenheiro.
 */
export async function aprovarLaudo(
  input: AprovarInput,
): Promise<AprovarResultado> {
  const assinanteNome = input.assinanteNome.trim();
  const assinanteCrea = input.assinanteCrea.trim();

  if (!assinanteNome) {
    return { erro: "Informe o nome do responsável técnico que assina." };
  }
  if (!input.confirmado) {
    return { erro: "Marque a confirmação de que revisou e assina o laudo." };
  }

  const parsed = laudoSchema.safeParse(input.extracao);
  if (!parsed.success) {
    return {
      erro: "Há campos obrigatórios em branco ou inválidos. Revise os destacados em vermelho.",
    };
  }

  const [laudo] = await db
    .select()
    .from(laudos)
    .where(eq(laudos.id, input.id));
  if (!laudo) return { erro: "Laudo não encontrado." };
  if (laudo.status === "extraindo") {
    return { erro: "A extração ainda não terminou. Aguarde e tente de novo." };
  }

  await db
    .update(laudos)
    .set({
      extracao: parsed.data,
      status: "publicado",
      assinanteNome,
      assinanteCrea: assinanteCrea || null,
      publicadoEm: new Date(),
      // Gera o link público ao publicar (P4, ADR-006). Reusa o token se já
      // existe — re-publicar não muda a URL que o síndico já recebeu.
      shareToken: laudo.shareToken ?? generateShareToken(),
    })
    .where(eq(laudos.id, input.id));

  redirect(`/laudos/${input.id}`);
}
