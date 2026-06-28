import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import {
  pontoDeLaudo,
  type TimelinePonto,
  type TimelinePredio,
} from "@/lib/timeline";

/**
 * Acesso a banco da timeline multi-laudo (P5 `equipamento-timeline`, ADR-007).
 * Separado de `timeline.ts` (helpers puros) pelo guard `server-only` — só roda
 * no servidor, nunca vaza a conexão pro cliente. O seed reusa os helpers puros,
 * não isto.
 *
 * Guardrail de liability (ADR-002): toda query filtra `status = 'publicado'`.
 * Laudo em `extraindo`/`revisar` NUNCA entra na timeline.
 */

/**
 * Carrega a timeline de um prédio: só laudos `publicado` com a mesma
 * `predio_key`, ordenados por data de inspeção (asc). Retorna null se não há
 * nenhum publicado com a chave.
 */
export async function getTimelinePredio(
  predioKey: string,
): Promise<TimelinePredio | null> {
  const rows = await db
    .select()
    .from(laudos)
    .where(and(eq(laudos.predioKey, predioKey), eq(laudos.status, "publicado")));

  const pontos = rows
    .map((r) =>
      r.extracao
        ? pontoDeLaudo({
            id: r.id,
            shareToken: r.shareToken,
            extracao: r.extracao,
            publicadoEm: r.publicadoEm,
            createdAt: r.createdAt,
          })
        : null,
    )
    .filter((p): p is TimelinePonto => p !== null)
    .sort((a, b) => a.dataMs - b.dataMs);

  if (pontos.length === 0) return null;

  // Nome do prédio: o do laudo mais recente (já revisado pelo RT).
  const recente = rows.find((r) => r.id === pontos[pontos.length - 1].laudoId);
  const predioNome = recente?.extracao?.predio?.nome ?? predioKey;

  // União dos equipamentos vistos no histórico (slug → nome mais recente).
  const equipMap = new Map<string, string>();
  for (const p of pontos) {
    for (const e of p.porEquipamento) equipMap.set(e.slug, e.nome);
  }

  return {
    predioKey,
    predioNome,
    equipamentos: [...equipMap].map(([slug, nome]) => ({ slug, nome })),
    pontos,
  };
}

/**
 * Conta quantos laudos `publicado` compartilham a mesma `predio_key`. Usado pelo
 * dashboard do laudo pra só oferecer o link da timeline quando há ≥2 (senão não
 * há "filme", só "foto").
 */
export async function contarPublicadosDoPredios(
  predioKey: string,
): Promise<number> {
  const rows = await db
    .select({ id: laudos.id })
    .from(laudos)
    .where(and(eq(laudos.predioKey, predioKey), eq(laudos.status, "publicado")));
  return rows.length;
}
