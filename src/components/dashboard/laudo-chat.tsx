"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  Eraser,
  Maximize2,
  MessageCircleQuestion,
  Minimize2,
  Send,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "Pergunte ao laudo" (P5 `pergunte-ao-laudo-chat`): chat Q&A em PT onde a
 * resposta vem SÓ do conteúdo do laudo (grounding no servidor — ver
 * `lib/ai/chat.ts`). Streaming token a token via `useChat`.
 *
 * A resposta é renderizada como Markdown (react-markdown + GFM) — antes saía o
 * texto cru com `**`/listas "feias". O painel pode ser recolhido (esconder),
 * expandido (controlar tamanho) e a conversa pode ser limpa; as preferências de
 * recolher/expandir ficam no localStorage.
 *
 * Reusado no painel (`/laudos/[id]`, `api` por id) e no link público
 * (`/r/[token]`, `api` por token) — o endpoint é a única diferença.
 */

const SUGESTOES = [
  "Posso usar o elevador normalmente?",
  "Qual é o problema mais urgente?",
  "Quais os prazos para corrigir?",
];

const PREFS_KEY = "el-chat-prefs";

export function LaudoChat({ api }: { api: string }) {
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api }),
  });
  const [input, setInput] = useState("");
  const [aberto, setAberto] = useState(true);
  const [expandido, setExpandido] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Carrega/salva preferências de recolher/expandir.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { aberto?: boolean; expandido?: boolean };
        queueMicrotask(() => {
          if (typeof p.aberto === "boolean") setAberto(p.aberto);
          if (typeof p.expandido === "boolean") setExpandido(p.expandido);
        });
      }
    } catch {
      // localStorage indisponível/corrompido — segue com o padrão.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ aberto, expandido }));
    } catch {
      // ignora falha de persistência
    }
  }, [aberto, expandido]);

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
      className="surface-panel rounded-2xl"
    >
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3 sm:px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-green/20 text-brand-green-strong">
          <MessageCircleQuestion className="size-4" strokeWidth={2.25} />
        </span>
        <h2 className="text-base font-semibold tracking-tight">
          Pergunte ao laudo
        </h2>

        <div className="ml-auto flex items-center gap-0.5">
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => setMessages([])}
              aria-label="Limpar conversa"
              title="Limpar conversa"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Eraser className="size-4" strokeWidth={2} />
            </button>
          ) : null}
          {aberto ? (
            <button
              type="button"
              onClick={() => setExpandido((v) => !v)}
              aria-label={expandido ? "Reduzir o chat" : "Expandir o chat"}
              title={expandido ? "Reduzir" : "Expandir"}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {expandido ? (
                <Minimize2 className="size-4" strokeWidth={2} />
              ) : (
                <Maximize2 className="size-4" strokeWidth={2} />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-label={aberto ? "Esconder o chat" : "Mostrar o chat"}
            title={aberto ? "Esconder" : "Mostrar"}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                aberto ? "" : "-rotate-90",
              )}
              strokeWidth={2}
            />
          </button>
        </div>
      </header>

      {aberto ? (
        <>
          <div
            ref={listRef}
            className={cn(
              "overflow-y-auto px-4 py-4 sm:px-5",
              expandido ? "max-h-[40rem]" : "max-h-96",
            )}
          >
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
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-green-strong/40 hover:bg-brand-green/10 hover:text-foreground disabled:opacity-50"
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
                      className={cn(
                        "flex",
                        meu ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                          meu
                            ? "bg-foreground whitespace-pre-wrap text-background"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {meu ? (
                          texto
                        ) : texto ? (
                          <div
                            className={cn(
                              "[&_a]:underline [&_a]:underline-offset-2",
                              "[&_p]:my-1.5 first:[&_p]:mt-0 last:[&_p]:mb-0",
                              "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4",
                              "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-4",
                              "[&_li]:my-0.5 [&_strong]:font-semibold",
                              "[&_h1]:my-1.5 [&_h1]:text-sm [&_h1]:font-semibold",
                              "[&_h2]:my-1.5 [&_h2]:text-sm [&_h2]:font-semibold",
                              "[&_h3]:my-1.5 [&_h3]:text-sm [&_h3]:font-semibold",
                              "[&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
                            )}
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {texto}
                            </ReactMarkdown>
                          </div>
                        ) : status === "streaming" ? (
                          "…"
                        ) : (
                          ""
                        )}
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
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <button
              type="submit"
              disabled={ocupado || !input.trim()}
              aria-label="Enviar pergunta"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" strokeWidth={2.25} />
            </button>
          </form>

          {/* Liability (ADR-002): o chat comunica o laudo, não certifica segurança. */}
          <p className="px-4 pb-3 text-xs text-muted-foreground sm:px-5">
            Respostas baseadas só neste laudo. Não substituem a avaliação do
            responsável técnico que o assinou.
          </p>
        </>
      ) : null}
    </section>
  );
}
