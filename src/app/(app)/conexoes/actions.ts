"use server";

import { revalidatePath } from "next/cache";

import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { gerarCodigoConexao } from "@/lib/conexoes-db";

/** Gera um novo código de conexão para o engenheiro logado. */
export async function gerarCodigo(): Promise<void> {
  const sessao = await getSessao();
  if (!sessao || !isEngenheiro(sessao.user.role)) return;
  await gerarCodigoConexao(sessao.user.id);
  revalidatePath("/conexoes");
}
