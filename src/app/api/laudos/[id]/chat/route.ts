import { eq } from "drizzle-orm";
import type { UIMessage } from "ai";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { responderSobreLaudo } from "@/lib/ai/chat";

// Endpoint do "Pergunte ao laudo" no painel do produtor (P5). Grounded por id:
// só responde a partir da extração persistida do laudo. Resposta em streaming.
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { messages }: { messages: UIMessage[] } = await req.json();

  const [laudo] = await db.select().from(laudos).where(eq(laudos.id, id));
  // Sem extração não há fonte da verdade — nada pra responder.
  if (!laudo?.extracao) {
    return new Response("Laudo não encontrado ou ainda sem extração", {
      status: 404,
    });
  }

  return responderSobreLaudo(laudo.extracao, messages);
}
