"use client";

import { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircleQuestion, Send, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "Pergunte ao laudo" (P5 `pergunte-ao-laudo-chat`): chat Q&A em PT onde o
 * síndico pergunta e a resposta vem SÓ do conteúdo do laudo (grounding no
 * servidor — ver `lib/ai/chat.ts`). Streaming token a token via `useChat`.
 *
 * Sem estado novo no servidor: o histórico vive no `useChat` (cliente) e cada
 * POST manda a conversa pro endpoint, que injeta o laudo como contexto. Reusado
 * no painel (`/laudos/[id]`, `api` por id) e no link público (`/r/[token]`,
 * `api` por token) — o endpoint é a única diferença.
 */

const SUGESTOES = [
  "Posso usar o elevador normalmente?",
  "Qual é o problema mais urgente?",
  "Quais os prazos para corrigir?",
];

export function LaudoChat({ api }: { api: string }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api }),
  });
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const ocupado = status === "submitted" || status === "streaming";

  function enviar(texto: string) {
    const t = texto.trim();
    if (!t || ocupado) return;
    sendMessage({ text: t });
    setInput("");
    // Rola pro fim na próxima pintura (mensagem nova já no DOM).
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }

  return (
    <section
      aria-label="Pergunte ao laudo"
      className="rounded-xl border border-border bg-card"
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <MessageCircleQuestion
          className="size-4 text-foreground"
          strokeWidth={2.25}
        />
        <h2 className="text-base font-semibold tracking-tight">
          Pergunte ao laudo
        </h2>
      </header>

      <div ref={listRef} className="max-h-96 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tire dúvidas em português. A resposta sai só do que está neste
              laudo — sem inventar.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  disabled={ocupado}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <Sparkles className="size-3.5" strokeWidth={2} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {messages.map((m) => {
              const texto = m.parts
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("");
              const meu = m.role === "user";
              return (
                <li
                  key={m.id}
                  className={cn("flex", meu ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                      meu
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {texto ||
                      (status === "streaming" ? "…" : "")}
                  </div>
                </li>
              );
            })}
            {status === "submitted" ? (
              <li className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                  Lendo o laudo…
                </div>
              </li>
            ) : null}
          </ol>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="flex items-center gap-2 border-t border-border px-4 py-3 sm:px-5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: posso usar o elevador?"
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={ocupado || !input.trim()}
          aria-label="Enviar pergunta"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" strokeWidth={2} />
        </button>
      </form>

      {/* Liability (ADR-002): o chat comunica o laudo, não certifica segurança. */}
      <p className="px-4 pb-3 text-xs text-muted-foreground sm:px-5">
        Respostas baseadas só neste laudo. Não substituem a avaliação do
        responsável técnico que o assinou.
      </p>
    </section>
  );
}
