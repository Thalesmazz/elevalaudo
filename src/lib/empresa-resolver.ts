import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { empresas } from "@/db/schema";

export type ResolverEmpresaResultado =
  | { erro: string; empresaId?: undefined }
  | { erro?: undefined; empresaId: string };

/**
 * Resolve a empresa/cliente de um form de criação de laudo (upload ou
 * manual): ou é uma empresa existente (confere ownership pra evitar id
 * forjado), ou é o nome de uma nova (cria na hora). Sem empresa não dá pra
 * agrupar o laudo na lateral.
 */
export async function resolverEmpresaDoForm(
  userId: string,
  formData: FormData,
): Promise<ResolverEmpresaResultado> {
  const empresaIdRaw = (formData.get("empresaId") as string | null)?.trim();
  const empresaNomeRaw = (
    formData.get("empresaNome") as string | null
  )?.trim();

  if (empresaIdRaw) {
    const [dono] = await db
      .select({ id: empresas.id })
      .from(empresas)
      .where(and(eq(empresas.id, empresaIdRaw), eq(empresas.ownerUserId, userId)))
      .limit(1);
    if (!dono) return { erro: "Empresa inválida." };
    return { empresaId: empresaIdRaw };
  }

  if (empresaNomeRaw && empresaNomeRaw.length >= 2) {
    const [nova] = await db
      .insert(empresas)
      .values({ nome: empresaNomeRaw, ownerUserId: userId })
      .returning({ id: empresas.id });
    return { empresaId: nova.id };
  }

  return { erro: "Escolha ou crie uma empresa." };
}
