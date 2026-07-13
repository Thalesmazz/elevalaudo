"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "motion/react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck2,
  FileText,
  Files,
  FileUp,
  Layers,
  Loader2,
  MessageCircleQuestion,
  ScanText,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { LogoMark } from "@/components/logo";
import { NcCharts } from "@/components/dashboard/nc-charts";
import { STATUS_ORDER, statusConfig, severidadeConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useDemoCursor, wait } from "@/components/demo/demo-cursor";
import {
  DEMO_ARQUIVO,
  DEMO_CHAT_QAS,
  DEMO_KPIS,
  DEMO_LISTA_KPIS,
  DEMO_LISTA_LAUDOS,
  DEMO_NCS,
  DEMO_NC_EVOLUCAO,
  DEMO_PREDIO,
  DEMO_STATUS,
  EXTRACAO_STEPS,
  type DemoChatQa,
  type DemoChatSegmento,
  type DemoFluxo,
  type DemoLaudoResumo,
  type DemoNc,
} from "@/components/demo/demo-data";

type SceneProps = { reducedMotion: boolean; playing: boolean };

/**
 * As cenas montam uma por vez (o orquestrador usa `AnimatePresence
 * mode="wait"`), então cada cena roda sua sequência uma única vez a partir do
 * mount. `skip` (sem redução de movimento OU demo pausada) pula direto pro
 * estado final: com a demo pausada, o usuário assume o controle — os
 * elementos reais (toggle de gráfico, dropzone, abas) continuam clicáveis
 * pra valer, sem o script de piloto automático competindo com o clique dele.
 */

/* ------------------------------------------------------------- cena 1 --- */

export function SceneUpload({ reducedMotion, playing }: SceneProps) {
  const [step, setStep] = useState<"idle" | "selected" | "sending">("idle");
  const dropRef = useRef<HTMLDivElement>(null);
  const cursor = useDemoCursor();
  const skip = reducedMotion || !playing;
  // Reduzido: sempre mostra o estado final. Pausado (não-reduzido): mostra o
  // `step` de verdade — é ele que o clique manual do visitante manipula.
  const displayStep = reducedMotion ? "sending" : step;

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    (async () => {
      cursor.show();
      await wait(150);
      if (cancelled) return;
      await cursor.moveToEl(dropRef.current);
      if (cancelled) return;
      await cursor.pulse();
      if (cancelled) return;
      setStep("selected");
      await wait(600);
      if (cancelled) return;
      setStep("sending");
    })();
    return () => {
      cancelled = true;
      cursor.hide();
    };
  }, [skip, cursor]);

  // Pausado: dropzone vira um botão de verdade — clicar cicla os estados.
  function handleManualClick() {
    if (!playing) {
      setStep((s) => (s === "idle" ? "selected" : s === "selected" ? "sending" : "idle"));
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col justify-center gap-5 p-6 sm:p-8">
      <div>
        <p className="text-kicker">Nova extração</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          Enviar o PDF do laudo
        </h3>
      </div>

      <div
        ref={dropRef}
        onClick={handleManualClick}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-input bg-muted/30 px-6 py-10 text-center transition-colors",
          !playing && "cursor-pointer hover:border-brand-green-strong/50 hover:bg-brand-green/10",
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
          <FileUp className="size-5 text-brand-green-strong" />
        </span>
        {displayStep === "idle" ? (
          <>
            <span className="text-sm font-medium text-foreground">
              Clique para escolher o PDF do laudo
            </span>
            <span className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
              Selecionar arquivo
            </span>
          </>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-background px-3 py-2 ring-1 ring-border">
            <FileText className="size-4 shrink-0 text-brand-green-strong" />
            <span className="truncate font-mono text-xs text-foreground/80">
              {DEMO_ARQUIVO}
            </span>
          </div>
        )}
        {!playing ? (
          <span className="text-[0.68rem] text-muted-foreground">
            Demo pausada · clique para simular
          </span>
        ) : null}
      </div>

      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm"
      >
        {displayStep === "sending" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando…
          </>
        ) : (
          "Enviar laudo"
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- cena 2 --- */

const TIPS = [
  {
    title: "A revisão continua com o responsável técnico",
    text: "A IA estrutura o laudo; o engenheiro revisa, assina e publica antes de compartilhar.",
    Icon: ShieldCheck,
  },
  {
    title: "Pergunte ao laudo depois da leitura",
    text: "Quando a extração termina, o chat responde em português simples usando só o PDF.",
    Icon: MessageCircleQuestion,
  },
] as const;

export function SceneExtracao({ reducedMotion, playing }: SceneProps) {
  const [doneCount, setDoneCount] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const tip = TIPS[tipIndex];
  const skip = reducedMotion || !playing;
  const displayDoneCount = skip ? EXTRACAO_STEPS.length : doneCount;

  useEffect(() => {
    if (skip) return;
    const stepMs = 950;
    const timers = EXTRACAO_STEPS.map((_, i) =>
      window.setTimeout(() => setDoneCount(i + 1), (i + 1) * stepMs),
    );
    const tipTimer = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 2100);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearInterval(tipTimer);
    };
  }, [skip]);

  return (
    <div className="relative grid h-full items-center gap-6 overflow-hidden p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div
        aria-hidden
        className="extraction-scan absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-green-strong/70 to-transparent"
      />
      <div className="flex min-w-0 flex-col items-center justify-center text-center lg:items-start lg:text-left">
        <div className="relative mb-5">
          <span
            aria-hidden
            className="extraction-halo absolute inset-[-1rem] rounded-[1.75rem] bg-brand-green/25 blur-xl"
          />
          <LogoMark className="extraction-logo-pulse relative size-16" />
        </div>
        <p className="text-kicker">Extração em andamento</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          Transformando o PDF em painel
        </h3>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-cream-soft px-3 py-2 text-xs text-muted-foreground ring-1 ring-border">
          <ScanText className="size-4 shrink-0 text-brand-green-strong" />
          <span className="truncate font-mono">{DEMO_ARQUIVO}</span>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="grid gap-2">
          {EXTRACAO_STEPS.map((step, index) => {
            const done = index < displayDoneCount;
            return (
              <div
                key={step}
                className="flex items-center gap-2 rounded-xl bg-muted/45 px-3 py-2"
              >
                {done ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-brand-green-strong" />
                ) : (
                  <span
                    className="extraction-step-dot size-2 shrink-0 rounded-full bg-brand-green-strong"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    done ? "text-foreground/85" : "text-foreground/60",
                  )}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        <div
          key={tip.title}
          className="extraction-tip-enter rounded-2xl border border-border bg-background/70 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/20 text-brand-green-strong">
              <tip.Icon className="size-3.5" strokeWidth={2.25} />
            </span>
            <p className="text-xs font-medium text-foreground/85">{tip.title}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------- cena 3 --- */

export function SceneDashboard({ reducedMotion, playing }: SceneProps) {
  const [counts, setCounts] = useState({ equip: 0, ncs: 0, urgentes: 0 });
  const [expandido, setExpandido] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const cursor = useDemoCursor();
  const status = statusConfig[DEMO_STATUS];
  const skip = reducedMotion || !playing;
  const displayCounts = skip
    ? {
        equip: DEMO_KPIS.equipamentos,
        ncs: DEMO_KPIS.naoConformidades,
        urgentes: DEMO_KPIS.urgentes,
      }
    : counts;

  useEffect(() => {
    if (skip) return;
    const controls = [
      animate(0, DEMO_KPIS.equipamentos, {
        duration: 1,
        ease: "easeOut",
        onUpdate: (v) => setCounts((c) => ({ ...c, equip: Math.round(v) })),
      }),
      animate(0, DEMO_KPIS.naoConformidades, {
        duration: 1.3,
        ease: "easeOut",
        onUpdate: (v) => setCounts((c) => ({ ...c, ncs: Math.round(v) })),
      }),
      animate(0, DEMO_KPIS.urgentes, {
        duration: 1.6,
        ease: "easeOut",
        onUpdate: (v) => setCounts((c) => ({ ...c, urgentes: Math.round(v) })),
      }),
    ];

    let cancelled = false;
    (async () => {
      cursor.show();
      await wait(600);
      if (cancelled) return;
      const linhaBtn = chartRef.current?.querySelectorAll("button")[1];
      if (linhaBtn) {
        await cursor.moveToEl(linhaBtn);
        if (cancelled) return;
        await cursor.pulse();
        linhaBtn.click();
      }
    })();

    return () => {
      cancelled = true;
      controls.forEach((c) => c.stop());
      cursor.hide();
    };
  }, [skip, cursor]);

  const ncsPreview = DEMO_NCS.slice(0, 3);
  const ncsRestantes = DEMO_NCS.length - ncsPreview.length;

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <status.Icon className={cn("size-5", status.accent)} strokeWidth={2.25} />
          <span className={cn("text-lg font-semibold tracking-tight", status.accent)}>
            {status.label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-2 py-1.5 ring-1 ring-inset ring-white/10">
          <span className="size-2.5 rounded-full bg-emerald-500/20" />
          <span className="status-lamp-on size-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.6)]" />
          <span className="size-2.5 rounded-full bg-red-500/20" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { v: displayCounts.equip, l: "Equipamentos" },
          { v: displayCounts.ncs, l: "Não-conf." },
          { v: displayCounts.urgentes, l: "Urgentes" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-card px-2.5 py-2">
            <p className="text-lg font-semibold tracking-tight tabular-nums">{k.v}</p>
            <p className="text-[0.66rem] leading-tight text-muted-foreground">{k.l}</p>
          </div>
        ))}
      </div>

      <div ref={chartRef} className="rounded-2xl border border-border bg-card p-3">
        <p className="mb-1 text-[0.68rem] font-medium text-muted-foreground">
          Não-conformidades por inspeção
        </p>
        <NcCharts data={DEMO_NC_EVOLUCAO} heightClassName="h-36 sm:h-40" />
      </div>

      <div className="space-y-1.5">
        {ncsPreview.map((nc) => {
          const cfg = severidadeConfig[nc.severidade];
          const aberto = expandido === nc.texto;
          return (
            <div
              key={nc.texto}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setExpandido(aberto ? null : nc.texto)}
                aria-expanded={aberto}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                    cfg.pill,
                  )}
                >
                  <cfg.Icon className="size-3.5" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-foreground/80">
                  {nc.texto}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform",
                    aberto && "rotate-180",
                  )}
                  strokeWidth={2.25}
                />
              </button>
              {aberto ? (
                <div className="space-y-1 border-t border-border bg-muted/30 px-3 py-2 text-[0.7rem] leading-5 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground/80">Ação: </span>
                    {nc.acao}
                  </p>
                  <p>
                    <span className="font-medium text-foreground/80">Prazo: </span>
                    {nc.prazo}
                    <span className="font-mono"> · NBR 16858 item {nc.itemNbr}</span>
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
        {ncsRestantes > 0 ? (
          <p className="px-1 text-[0.68rem] text-muted-foreground">
            +{ncsRestantes} outra{ncsRestantes === 1 ? "" : "s"} não-conformidade
            {ncsRestantes === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- cena 4 --- */

function contarPalavrasResposta(resposta: DemoChatSegmento[][]): number {
  return resposta
    .flat()
    .reduce((n, s) => n + s.texto.split(/\s+/).filter(Boolean).length, 0);
}

/** As 2 primeiras perguntas do roteiro (índices 0 e 2 de `DEMO_CHAT_QAS`) —
 * uma conversa curta e natural: primeiro se pode usar o elevador, depois o
 * prazo pra corrigir. A pergunta "qual o mais urgente" fica de reserva só
 * pro visitante explorar manualmente com a demo pausada. */
const ROTEIRO_AUTOPLAY = [DEMO_CHAT_QAS[0], DEMO_CHAT_QAS[2]];

/**
 * Encena o "Pergunte ao laudo" (a UI real de `dashboard/laudo-chat.tsx`) sem
 * chamar a API: uma conversa curta e contínua — 2 perguntas, 2 respostas —
 * grounded só nas `DEMO_NCS`, mesmo tom liability-safe do produto. A 1ª
 * pergunta nasce de um clique num chip de sugestão; a 2ª é "digitada" no
 * campo pelo cursor-fantasma, como um visitante de verdade faria depois que
 * os chips já sumiram. Cada resposta streama palavra a palavra, imitando o
 * streaming real do `useChat`. Pausada, os chips ainda não usados continuam
 * clicáveis — o visitante pode continuar a conversa à sua maneira.
 */
export function SceneChat({ reducedMotion, playing }: SceneProps) {
  const [mensagens, setMensagens] = useState<DemoChatQa[]>(() =>
    reducedMotion ? ROTEIRO_AUTOPLAY : [],
  );
  const [fase, setFase] = useState<"lendo" | "streaming" | "done">("lendo");
  const [palavras, setPalavras] = useState(0);
  const [inputTexto, setInputTexto] = useState("");
  const chipsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const sendBtnRef = useRef<HTMLSpanElement>(null);
  const cursor = useDemoCursor();
  const status = statusConfig[DEMO_STATUS];
  const skip = reducedMotion || !playing;

  const ultima = mensagens[mensagens.length - 1] ?? null;
  const totalPalavrasUltima = useMemo(
    () => (ultima ? contarPalavrasResposta(ultima.resposta) : 0),
    [ultima],
  );

  const displayFase = reducedMotion ? "done" : fase;
  const displayPalavras = reducedMotion ? totalPalavrasUltima : palavras;
  const ocupado = mensagens.length > 0 && displayFase !== "done";

  // Rola pro fim a cada mensagem nova ou palavra revelada — mesmo padrão do
  // chat real (`laudo-chat.tsx`), só que aqui não depende de clique.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [mensagens.length, palavras]);

  function perguntar(escolhida: DemoChatQa) {
    setMensagens((m) => [...m, escolhida]);
    setPalavras(0);
    setFase(reducedMotion ? "done" : "lendo");
  }

  // Piloto automático: 1ª pergunta por clique num chip; depois de streamar a
  // resposta, o cursor "digita" a 2ª pergunta no campo e a submete — uma
  // conversa contínua, não só um clique isolado.
  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    (async () => {
      cursor.show();
      await wait(500);
      if (cancelled) return;

      const chip = chipsRef.current?.querySelector("button");
      if (chip) {
        await cursor.moveToEl(chip);
        if (cancelled) return;
        await cursor.pulse();
        chip.click();
      }
      // espera a 1ª resposta terminar de streamar (lendo + palavras + pausa)
      await wait(700 + contarPalavrasResposta(ROTEIRO_AUTOPLAY[0].resposta) * 40 + 900);
      if (cancelled) return;

      await cursor.moveToEl(inputRef.current);
      if (cancelled) return;
      const pergunta2 = ROTEIRO_AUTOPLAY[1].pergunta;
      for (let i = 1; i <= pergunta2.length; i++) {
        if (cancelled) return;
        setInputTexto(pergunta2.slice(0, i));
        await wait(38);
      }
      await wait(300);
      if (cancelled) return;

      await cursor.moveToEl(sendBtnRef.current);
      if (cancelled) return;
      await cursor.pulse();
      setInputTexto("");
      perguntar(ROTEIRO_AUTOPLAY[1]);
      cursor.hide();
    })();
    return () => {
      cancelled = true;
      cursor.hide();
      setInputTexto("");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, cursor]);

  // "Lendo o laudo…" → streaming palavra a palavra → mensagem completa.
  useEffect(() => {
    if (!ultima || reducedMotion) return;
    if (fase === "lendo") {
      const t = window.setTimeout(() => setFase("streaming"), 700);
      return () => window.clearTimeout(t);
    }
    if (fase === "streaming") {
      const t = window.setInterval(() => {
        setPalavras((p) => Math.min(p + 1, totalPalavrasUltima));
      }, 40);
      return () => window.clearInterval(t);
    }
  }, [ultima, fase, reducedMotion, totalPalavrasUltima]);

  useEffect(() => {
    if (fase === "streaming" && totalPalavrasUltima > 0 && palavras >= totalPalavrasUltima) {
      setFase("done");
    }
  }, [fase, palavras, totalPalavrasUltima]);

  const jaPerguntadas = new Set(mensagens.map((m) => m.pergunta));
  const sugestoesDisponiveis = DEMO_CHAT_QAS.filter(
    (q) => !jaPerguntadas.has(q.pergunta),
  );
  const mostrarChips =
    sugestoesDisponiveis.length > 0 && (mensagens.length === 0 || !playing);

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5 sm:p-6">
      {/* laudo aberto — mesma leitura (status.ts) da cena de dashboard */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2.5">
        <p className="min-w-0 truncate text-sm font-semibold tracking-tight">
          {DEMO_PREDIO}
        </p>
        <span className="flex shrink-0 items-center gap-1.5">
          <status.Icon className={cn("size-4", status.accent)} strokeWidth={2.25} />
          <span className={cn("text-sm font-semibold tracking-tight", status.accent)}>
            {status.label}
          </span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-green/20 text-brand-green-strong">
            <MessageCircleQuestion className="size-4" strokeWidth={2.25} />
          </span>
          <p className="text-base font-semibold tracking-tight">Pergunte ao laudo</p>
        </div>

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          {mensagens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tire dúvidas em português. A resposta sai só do que está neste
              laudo — sem inventar.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {mensagens.map((msg, i) => {
                const éÚltima = i === mensagens.length - 1;
                const faseMsg = éÚltima ? displayFase : "done";
                const palavrasMsg = éÚltima
                  ? displayPalavras
                  : contarPalavrasResposta(msg.resposta);
                return (
                  <li key={msg.pergunta} className="flex flex-col gap-2">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-foreground px-3.5 py-2 text-sm leading-relaxed text-background">
                        {msg.pergunta}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      {faseMsg === "lendo" ? (
                        <div className="rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                          Lendo o laudo…
                        </div>
                      ) : (
                        <div className="max-w-[85%] rounded-2xl bg-muted px-3.5 py-2 text-sm leading-relaxed text-foreground">
                          <RespostaStream
                            resposta={msg.resposta}
                            palavras={palavrasMsg}
                            digitando={faseMsg === "streaming"}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {mostrarChips ? (
            <div ref={chipsRef} className="flex flex-wrap gap-2">
              {sugestoesDisponiveis.map((opcao) => (
                <button
                  key={opcao.pergunta}
                  type="button"
                  disabled={ocupado}
                  onClick={() => perguntar(opcao)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-green-strong/40 hover:bg-brand-green/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  <Sparkles className="size-3.5" strokeWidth={2} />
                  {opcao.pergunta}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* input decorativo — na demo quem "digita" é o cursor-fantasma */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3" aria-hidden>
          <div
            ref={inputRef}
            className="pointer-events-none min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {inputTexto ? (
              <span className="text-foreground">
                {inputTexto}
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-brand-green-strong align-[-2px]" />
              </span>
            ) : (
              <span className="text-muted-foreground/60">
                Ex: posso usar o elevador?
              </span>
            )}
          </div>
          <span
            ref={sendBtnRef}
            className={cn(
              "pointer-events-none inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground transition-opacity",
              inputTexto
                ? "bg-primary opacity-100"
                : "bg-primary opacity-40",
            )}
          >
            <Send className="size-4" strokeWidth={2.25} />
          </span>
        </div>

        {/* Liability (ADR-002): o chat comunica o laudo, não certifica segurança. */}
        <p className="px-4 pb-3 text-xs text-muted-foreground">
          Respostas baseadas só neste laudo. Não substituem a avaliação do
          responsável técnico que o assinou.
        </p>
      </div>
    </div>
  );
}

/** Revela a resposta por contagem de palavras, parágrafo a parágrafo, com o
 * negrito vindo da estrutura (`forte`) — sem parsear Markdown no meio do
 * stream. O caret verde pisca no fim do último trecho enquanto digita. */
function RespostaStream({
  resposta,
  palavras,
  digitando,
}: {
  resposta: DemoChatSegmento[][];
  palavras: number;
  digitando: boolean;
}) {
  let restante = palavras;
  const paragrafos = resposta
    .map((paragrafo, pi) => {
      const partes: { key: string; texto: string; forte?: boolean }[] = [];
      paragrafo.forEach((seg, si) => {
        const tokens = seg.texto.split(/\s+/).filter(Boolean);
        if (restante <= 0 || tokens.length === 0) return;
        const take = Math.min(tokens.length, restante);
        restante -= take;
        partes.push({
          key: `${pi}-${si}`,
          texto: tokens.slice(0, take).join(" "),
          forte: seg.forte,
        });
      });
      return { key: pi, partes };
    })
    .filter((p) => p.partes.length > 0);

  return (
    <div className="space-y-1.5">
      {paragrafos.map((paragrafo, i) => (
        <p key={paragrafo.key}>
          {paragrafo.partes.map((parte, j) => (
            <span key={parte.key} className={parte.forte ? "font-semibold" : undefined}>
              {j > 0 ? " " : ""}
              {parte.texto}
            </span>
          ))}
          {digitando && i === paragrafos.length - 1 ? (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-brand-green-strong align-[-2px]"
            />
          ) : null}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- cena 5 --- */

const FLUXO_PILL: Record<DemoFluxo, { label: string; cls: string }> = {
  rascunho: {
    label: "Rascunho",
    cls: "bg-zinc-400/10 text-zinc-600 ring-zinc-400/25 dark:text-zinc-400",
  },
  extraindo: {
    label: "Extraindo",
    cls: "bg-muted text-muted-foreground ring-border",
  },
  revisar: {
    label: "Revisar",
    cls: "bg-amber-400/10 text-amber-700 ring-amber-500/25 dark:text-amber-400",
  },
  publicado: {
    label: "Publicado",
    cls: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
  },
};

const LISTA_TABS = [
  { value: "todos", label: "Todos", Icon: Layers },
  { value: "publicado", label: "Publicados", Icon: FileCheck2 },
  { value: "andamento", label: "Em andamento", Icon: Clock },
] as const;

/**
 * Conteúdo genérico ao "abrir" um laudo na lista — não é o laudo de verdade
 * do prédio (evita manter uma segunda fonte de dados fictícios por prédio),
 * é só o suficiente pra o semáforo e as NCs abertas conversarem com o status
 * já mostrado na lista (mesma leitura, mesma cor, mesmo vocabulário).
 */
const DETALHE_GENERICO: Record<
  "seguro" | "atencao" | "urgente",
  DemoNc[]
> = {
  seguro: [],
  atencao: [
    { severidade: "atencao", texto: "Pendência apontada no laudo, dentro do prazo de correção" },
    { severidade: "leve", texto: "Item de manutenção preventiva registrado" },
  ],
  urgente: [
    { severidade: "urgente", texto: "Risco apontado no laudo — ação imediata recomendada" },
    { severidade: "atencao", texto: "Pendência adicional dentro do prazo" },
  ],
};

export function SceneLista({ reducedMotion, playing }: SceneProps) {
  const [tab, setTab] = useState<(typeof LISTA_TABS)[number]["value"]>("todos");
  const [aberto, setAberto] = useState<DemoLaudoResumo | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cursor = useDemoCursor();
  const skip = reducedMotion || !playing;

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    (async () => {
      cursor.show();
      await wait(500);
      if (cancelled) return;
      const publicadosBtn = listRef.current?.querySelector<HTMLButtonElement>(
        '[data-tab="publicado"]',
      );
      if (publicadosBtn) {
        await cursor.moveToEl(publicadosBtn);
        if (cancelled) return;
        await cursor.pulse();
        publicadosBtn.click();
      }

      await wait(900);
      if (cancelled) return;
      const primeiraLinha = listRef.current?.querySelector<HTMLButtonElement>(
        'button[aria-label^="Abrir"]',
      );
      if (primeiraLinha) {
        await cursor.moveToEl(primeiraLinha);
        if (cancelled) return;
        await cursor.pulse();
        primeiraLinha.click();
      }
    })();
    return () => {
      cancelled = true;
      cursor.hide();
    };
  }, [skip, cursor]);

  const laudosFiltrados = useMemo(() => {
    if (tab === "todos") return DEMO_LISTA_LAUDOS;
    if (tab === "publicado") {
      return DEMO_LISTA_LAUDOS.filter((l) => l.fluxo === "publicado");
    }
    return DEMO_LISTA_LAUDOS.filter((l) => l.fluxo !== "publicado");
  }, [tab]);

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5 sm:p-6">
      <div>
        <p className="text-kicker">Operação de laudos</p>
        <h3 className="mt-1.5 text-lg font-semibold tracking-tight">Meus laudos</h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { v: DEMO_LISTA_KPIS.laudos, l: "Laudos", Icon: Files },
          { v: DEMO_LISTA_KPIS.publicados, l: "Publicados", Icon: FileCheck2 },
          { v: DEMO_LISTA_KPIS.emAndamento, l: "Em andamento", Icon: Clock },
          { v: DEMO_LISTA_KPIS.predios, l: "Prédios", Icon: Building2 },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-card px-2 py-2">
            <k.Icon className="size-3.5 text-muted-foreground" strokeWidth={2.25} />
            <p className="mt-1 text-base font-semibold tracking-tight tabular-nums">{k.v}</p>
            <p className="text-[0.62rem] leading-tight text-muted-foreground">{k.l}</p>
          </div>
        ))}
      </div>

      {aberto ? (
        <DetalheLaudo laudo={aberto} onVoltar={() => setAberto(null)} />
      ) : (
        <div ref={listRef} className="contents">
          <div className="flex items-center gap-1.5">
            {LISTA_TABS.map((t) => {
              const ativo = tab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  data-tab={t.value}
                  onClick={() => setTab(t.value)}
                  aria-pressed={ativo}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    ativo
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <t.Icon className="size-3.5" strokeWidth={2} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 overflow-hidden">
            {laudosFiltrados.map((laudo) => {
              const fluxo = FLUXO_PILL[laudo.fluxo];
              const rag = laudo.status ? statusConfig[laudo.status] : null;
              return (
                <button
                  key={laudo.titulo}
                  type="button"
                  onClick={() => setAberto(laudo)}
                  aria-label={`Abrir ${laudo.titulo}`}
                  className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-left transition-colors hover:border-brand-green-strong/40 hover:bg-brand-green/5"
                >
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium ring-1 ring-inset",
                      fluxo.cls,
                    )}
                  >
                    {fluxo.label}
                  </span>
                  {rag ? (
                    <rag.Icon className={cn("size-3.5 shrink-0", rag.accent)} strokeWidth={2.25} />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/85">
                    {laudo.titulo}
                  </span>
                  <span className="hidden shrink-0 truncate text-[0.68rem] text-muted-foreground sm:block">
                    {laudo.linha}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Abertura genérica de um laudo da lista — o semáforo lê o MESMO `status` do
 * badge clicado (fonte única em `status.ts`), então os dois nunca divergem. */
function DetalheLaudo({
  laudo,
  onVoltar,
}: {
  laudo: DemoLaudoResumo;
  onVoltar: () => void;
}) {
  const rag = laudo.status ? statusConfig[laudo.status] : null;
  const ncs = laudo.status ? DETALHE_GENERICO[laudo.status] : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <button
        type="button"
        onClick={onVoltar}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.25} />
        Voltar para a lista
      </button>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="truncate text-sm font-semibold tracking-tight">{laudo.titulo}</p>

        {rag ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex shrink-0 flex-col gap-1.5 rounded-xl bg-zinc-900 p-2 ring-1 ring-inset ring-white/10">
              {STATUS_ORDER.map((s) => {
                const lamp = statusConfig[s];
                const on = s === laudo.status;
                return (
                  <span
                    key={s}
                    aria-hidden
                    className={cn(
                      "size-3 rounded-full transition-opacity",
                      on ? cn(lamp.lampOn, "status-lamp-on") : cn(lamp.lampDim, "opacity-60"),
                    )}
                  />
                );
              })}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <rag.Icon className={cn("size-4.5", rag.accent)} strokeWidth={2.25} />
                <span className={cn("text-lg font-semibold tracking-tight", rag.accent)}>
                  {rag.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{rag.message}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {laudo.fluxo === "extraindo"
              ? "A extração ainda está em andamento — o dashboard aparece quando terminar."
              : "Rascunho sem PDF anexado — envie o laudo para gerar o dashboard."}
          </p>
        )}
      </div>

      {rag ? (
        <div className="space-y-1.5">
          {ncs.length > 0 ? (
            ncs.map((nc) => {
              const cfg = severidadeConfig[nc.severidade];
              return (
                <div
                  key={nc.texto}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-1.5"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                      cfg.pill,
                    )}
                  >
                    <cfg.Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="truncate text-xs text-foreground/80">{nc.texto}</span>
                </div>
              );
            })
          ) : (
            <p className="px-1 text-xs text-muted-foreground">
              Nenhuma não-conformidade apontada.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
