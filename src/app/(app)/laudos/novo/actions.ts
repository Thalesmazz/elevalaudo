"use server";

import { redirect } from "next/navigation";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { getSessao } from "@/lib/auth/session";
import { podeEditarLaudo } from "@/lib/auth/roles";
import { resolverEmpresaDoForm } from "@/lib/empresa-resolver";

export type CriarLaudoManualState = { erro?: string };

/**
 * Cria um laudo `rascunho` sem PDF — o engenheiro monta os dados do zero em
 * `/laudos/[id]/novo`. Guardrail de liability inalterado: publicar continua
 * exigindo revisão/assinatura (`aprovarLaudo`), rascunho só guarda progresso.
 */
export async function criarLaudoManual(
  _prev: CriarLaudoManualState,
  formData: FormData,
): Promise<CriarLaudoManualState> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };
  if (!podeEditarLaudo(sessao.user.role)) {
    return { erro: "Apenas o engenheiro pode criar laudos manualmente." };
  }

  const resolvida = await resolverEmpresaDoForm(sessao.user.id, formData);
  if (resolvida.erro) return { erro: resolvida.erro };

  const [novo] = await db
    .insert(laudos)
    .values({
      status: "rascunho",
      userId: sessao.user.id,
      empresaId: resolvida.empresaId,
    })
    .returning({ id: laudos.id });

  redirect(`/laudos/${novo.id}/novo`);
}
