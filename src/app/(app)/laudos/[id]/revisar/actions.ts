"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { laudoSchema } from "@/lib/schema/laudo";
import { getSessao } from "@/lib/auth/session";
import { podeEditarLaudo } from "@/lib/auth/roles";
import { generateShareToken } from "@/lib/share";
import { slugifyPredio } from "@/lib/timeline";

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
  // RBAC (defesa em profundidade): publicar/assinar é só do engenheiro.
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };
  if (!podeEditarLaudo(sessao.user.role)) {
    return { erro: "Apenas o engenheiro pode revisar e publicar laudos." };
  }

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
  if (laudo.userId !== sessao.user.id) {
    return { erro: "Você não tem permissão para revisar este laudo." };
  }
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
      // Chave de agrupamento da timeline (P5, ADR-007): congela a partir do nome
      // do prédio JÁ REVISADO pelo RT, não de OCR cru. Recalcula a cada publish
      // (se o RT corrige o nome, a chave acompanha).
      predioKey: slugifyPredio(parsed.data.predio.nome),
    })
    .where(eq(laudos.id, input.id));

  redirect(`/laudos/${input.id}`);
}
