import type { UIMessage } from "ai";

import { responderSobreLaudo } from "@/lib/ai/chat";
import { getSessao } from "@/lib/auth/session";
import { getLaudoAcessivelPorUsuario } from "@/lib/laudo-access";

// Endpoint do "Pergunte ao laudo" no painel do produtor (P5). Grounded por id:
// só responde a partir da extração persistida do laudo. Resposta em streaming.
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { messages }: { messages: UIMessage[] } = await req.json();

  const sessao = await getSessao();
  if (!sessao) return new Response("Não autenticado", { status: 401 });

  const acesso = await getLaudoAcessivelPorUsuario(id, sessao.user);
  const laudo = acesso?.laudo;
  // Sem extração não há fonte da verdade — nada pra responder.
  if (!laudo?.extracao) {
    return new Response("Laudo não encontrado ou ainda sem extração", {
      status: 404,
    });
  }

  return responderSobreLaudo(laudo.extracao, messages);
}
