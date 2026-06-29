"use server";

import { db } from "@/db";
import { empresas } from "@/db/schema";
import { getSessao } from "@/lib/auth/session";

/**
 * Cria uma empresa/cliente do usuário logado e devolve o id. Usada pelo fluxo
 * de upload ("criar nova empresa" no seletor). Mantém a empresa amarrada ao
 * `ownerUserId` — é o agrupamento da lateral.
 */
export async function criarEmpresa(
  nome: string,
): Promise<{ id: string } | { erro: string }> {
  const sessao = await getSessao();
  if (!sessao) return { erro: "Sessão expirada. Entre novamente." };

  const limpo = nome.trim();
  if (limpo.length < 2) return { erro: "Informe o nome da empresa." };

  const [empresa] = await db
    .insert(empresas)
    .values({ nome: limpo, ownerUserId: sessao.user.id })
    .returning({ id: empresas.id });

  return { id: empresa.id };
}
