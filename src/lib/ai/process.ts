import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { downloadLaudoPdf } from "@/lib/blob";
import { extrairLaudoDePdf } from "./extract";

/**
 * Orquestra a extração de um laudo: baixa o PDF → extrai (Claude) → persiste o
 * JSON do LaudoSchema e move pra status `revisar` (P1).
 *
 * Idempotente por laudo: só processa quem está em `extraindo`; re-rodar num
 * laudo já extraído não duplica nem sobrescreve a revisão. Publicar continua
 * sendo passo humano (P2) — aqui o laudo PARA em `revisar`.
 */
export async function processarLaudo(id: string): Promise<void> {
  const [laudo] = await db.select().from(laudos).where(eq(laudos.id, id));
  if (!laudo) throw new Error(`Laudo ${id} não encontrado`);

  // Guard de idempotência: já extraído (revisar/publicado) → não reprocessa.
  if (laudo.status !== "extraindo") return;
  // Invariante: todo laudo em `extraindo` veio do upload de PDF, então sempre
  // tem blobPathname — laudo `rascunho` (manual) nunca chega aqui.
  if (!laudo.blobPathname) {
    throw new Error(`Laudo ${id} em extraindo sem blobPathname`);
  }

  try {
    const pdf = await downloadLaudoPdf(laudo.blobPathname);
    const { data } = await extrairLaudoDePdf(pdf);

    await db
      .update(laudos)
      .set({
        extracao: data,
        status: "revisar",
        extraidoEm: new Date(),
        erroExtracao: null,
      })
      .where(
        // Só transiciona se ainda estiver `extraindo` (corrida → não duplica).
        eq(laudos.id, id),
      );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    await db
      .update(laudos)
      .set({ erroExtracao: msg })
      .where(eq(laudos.id, id));
    throw err;
  }
}
