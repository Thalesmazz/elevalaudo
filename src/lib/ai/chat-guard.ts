import "server-only";

import type { UIMessage } from "ai";

// Guarda barata ANTES de gastar IA (auditoria 2026-07): conversa gigante ou
// mensagem-parede é prompt-stuffing/abuso, não pergunta de síndico. O
// grounding (lib/ai/chat.ts) cuida do conteúdo; isto cuida do custo.
const MAX_MENSAGENS = 30;
const MAX_CHARS_ULTIMA = 4_000;

export function mensagensSaoAceitaveis(messages: UIMessage[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  if (messages.length > MAX_MENSAGENS) return false;

  const ultima = messages[messages.length - 1];
  const texto = (ultima.parts ?? [])
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  return texto.length <= MAX_CHARS_ULTIMA;
}
