import { and, eq } from "drizzle-orm";
import type { UIMessage } from "ai";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { responderSobreLaudo } from "@/lib/ai/chat";
import { mensagensSaoAceitaveis } from "@/lib/ai/chat-guard";
import { checarLimite, getClientIp } from "@/lib/rate-limit";

// Endpoint público do "Pergunte ao laudo" (P5) no link do síndico (ADR-006).
// Mesma regra do `/r/[token]`: SÓ laudo `publicado` é visível — token de laudo
// não-publicado responde igual a inexistente (não revela existência). Grounded
// no laudo daquele token; resposta em streaming.
// Rota pública que gasta IA → rate limit por token E por IP (custo é o risco).
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { messages }: { messages: UIMessage[] } = await req.json();

  if (!mensagensSaoAceitaveis(messages)) {
    return new Response("Conversa longa demais.", { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const [tokenOk, ipOk] = await Promise.all([
    checarLimite("chat-pub", token, 10, 60_000),
    checarLimite("chat-ip", ip, 60, 3_600_000),
  ]);
  if (!tokenOk || !ipOk) {
    return new Response("Muitas perguntas em sequência. Aguarde um minuto.", {
      status: 429,
    });
  }

  const [laudo] = await db
    .select()
    .from(laudos)
    .where(and(eq(laudos.shareToken, token), eq(laudos.status, "publicado")));

  if (!laudo?.extracao) {
    return new Response("Laudo não encontrado", { status: 404 });
  }

  return responderSobreLaudo(laudo.extracao, messages);
}
