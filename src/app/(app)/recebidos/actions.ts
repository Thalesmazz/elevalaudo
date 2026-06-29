"use server";

import { revalidatePath } from "next/cache";

import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { conectarPorCodigo } from "@/lib/conexoes-db";

export type ConectarState = { ok?: boolean; erro?: string; engenheiro?: string };

/** A administração reivindica um código de conexão de um engenheiro. */
export async function conectar(
  _prev: ConectarState,
  formData: FormData,
): Promise<ConectarState> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };
  if (isEngenheiro(sessao.user.role)) {
    return { erro: "Conexão por código é do lado da administração." };
  }

  const codigo = (formData.get("codigo") as string | null) ?? "";
  const r = await conectarPorCodigo(sessao.user.id, codigo);
  if (r.ok) {
    revalidatePath("/recebidos");
    return { ok: true, engenheiro: r.engenheiro };
  }
  return { erro: r.erro };
}
