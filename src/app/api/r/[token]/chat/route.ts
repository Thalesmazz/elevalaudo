import { and, eq } from "drizzle-orm";
import type { UIMessage } from "ai";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { responderSobreLaudo } from "@/lib/ai/chat";

// Endpoint público do "Pergunte ao laudo" (P5) no link do síndico (ADR-006).
// Mesma regra do `/r/[token]`: SÓ laudo `publicado` é visível — token de laudo
// não-publicado responde igual a inexistente (não revela existência). Grounded
// no laudo daquele token; resposta em streaming.
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { messages }: { messages: UIMessage[] } = await req.json();

  const [laudo] = await db
    .select()
    .from(laudos)
    .where(and(eq(laudos.shareToken, token), eq(laudos.status, "publicado")));

  if (!laudo?.extracao) {
    return new Response("Laudo não encontrado", { status: 404 });
  }

  return responderSobreLaudo(laudo.extracao, messages);
}
