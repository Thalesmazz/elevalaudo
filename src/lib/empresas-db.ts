import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { empresas, laudos } from "@/db/schema";
import type { LaudoExtraido } from "@/lib/schema/laudo";

/**
 * Dados da lateral (estilo "projeto" do Claude Code): as empresas/clientes do
 * usuário, cada uma com suas extrações (laudos). Também alimenta o modal de
 * gráficos — por isso traz `extracao` (contagem de NCs por severidade) e as
 * datas de inspeção/extração que viram os cards selecionáveis.
 */

export type LaudoDaEmpresa = {
  id: string;
  status: "rascunho" | "extraindo" | "revisar" | "publicado";
  titulo: string;
  /** Identificações dos elevadores (para o card do modal de gráficos). */
  elevadores: string[];
  dataInspecao: string | null;
  statusGeral: LaudoExtraido["statusGeral"] | null;
  /** Contagem de NCs por severidade — base dos gráficos. */
  contagem: { urgente: number; atencao: number; leve: number; total: number };
  /** Data da extração feita no site (ISO). */
  extraidoEmIso: string | null;
  criadoEmIso: string;
};

export type EmpresaComLaudos = {
  id: string;
  nome: string;
  laudos: LaudoDaEmpresa[];
};

function contar(extracao: LaudoExtraido) {
  const c = { urgente: 0, atencao: 0, leve: 0, total: 0 };
  for (const eq of extracao.equipamentos) {
    for (const nc of eq.naoConformidades) {
      c[nc.severidade] += 1;
      c.total += 1;
    }
  }
  return c;
}

export async function getEmpresasDoUsuario(
  userId: string,
): Promise<EmpresaComLaudos[]> {
  const empresasRows = await db
    .select()
    .from(empresas)
    .where(eq(empresas.ownerUserId, userId))
    .orderBy(desc(empresas.createdAt));

  if (empresasRows.length === 0) return [];

  const ids = empresasRows.map((e) => e.id);
  const laudosRows = await db
    .select()
    .from(laudos)
    .where(
      and(
        inArray(laudos.empresaId, ids),
        eq(laudos.userId, userId),
      ),
    )
    .orderBy(desc(laudos.createdAt));

  const porEmpresa = new Map<string, LaudoDaEmpresa[]>();
  for (const l of laudosRows) {
    if (!l.empresaId) continue;
    const ex = l.extracao;
    const item: LaudoDaEmpresa = {
      id: l.id,
      status: l.status,
      titulo: ex?.predio.nome || l.fileName || "Rascunho sem título",
      elevadores: ex?.equipamentos.map((e) => e.identificacao) ?? [],
      dataInspecao: ex?.dataInspecao ?? null,
      statusGeral: ex?.statusGeral ?? null,
      contagem: ex
        ? contar(ex)
        : { urgente: 0, atencao: 0, leve: 0, total: 0 },
      extraidoEmIso: l.extraidoEm ? l.extraidoEm.toISOString() : null,
      criadoEmIso: l.createdAt.toISOString(),
    };
    const arr = porEmpresa.get(l.empresaId) ?? [];
    arr.push(item);
    porEmpresa.set(l.empresaId, arr);
  }

  return empresasRows.map((e) => ({
    id: e.id,
    nome: e.nome,
    laudos: porEmpresa.get(e.id) ?? [],
  }));
}

/** Empresas do usuário (id+nome) para o seletor do upload. */
export async function getEmpresasSimples(
  userId: string,
): Promise<{ id: string; nome: string }[]> {
  return db
    .select({ id: empresas.id, nome: empresas.nome })
    .from(empresas)
    .where(eq(empresas.ownerUserId, userId))
    .orderBy(desc(empresas.createdAt));
}
