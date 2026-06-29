"use client";

import { useEffect, useState } from "react";
import {
  FileSearch,
  History,
  ListChecks,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const TIPS = [
  {
    title: "Pergunte ao laudo depois da leitura",
    text: "Quando a extração terminar, o chat responde em português simples usando apenas o conteúdo do PDF.",
    Icon: MessageCircleQuestion,
  },
  {
    title: "O histórico vira filme, não foto",
    text: "Com dois laudos publicados do mesmo prédio, o ElevaLaudo mostra a evolução das não-conformidades no tempo.",
    Icon: History,
  },
  {
    title: "Urgência e marca não se misturam",
    text: "O semáforo usa vermelho, âmbar e verde só para gravidade. A identidade da consultoria fica separada.",
    Icon: ShieldCheck,
  },
  {
    title: "A revisão continua com o responsável técnico",
    text: "A IA estrutura o laudo; o engenheiro revisa, assina e publica antes de compartilhar.",
    Icon: ListChecks,
  },
  {
    title: "O link público já sai pronto",
    text: "Após publicar, você pode mandar um link sem login para o síndico consultar e baixar o PDF branded.",
    Icon: Sparkles,
  },
] as const;

const STEPS = [
  "Lendo o PDF",
  "Separando equipamentos",
  "Classificando severidades",
  "Montando o dashboard",
] as const;

export function ExtractionLoading({ fileName }: { fileName: string }) {
  const [tipIndex, setTipIndex] = useState(0);
  const tip = TIPS[tipIndex];

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Extração do laudo em andamento"
      className="surface-panel relative overflow-hidden rounded-3xl"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--brand-green),transparent_45%),transparent_70%)]"
      />
      <div
        aria-hidden
        className="extraction-scan absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-green-strong/70 to-transparent"
      />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
        <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
          <div className="relative mb-6">
            <span
              aria-hidden
              className="extraction-halo absolute inset-[-1.25rem] rounded-[2rem] bg-brand-green/25 blur-xl"
            />
            <LogoMark className="extraction-logo-pulse relative size-20 drop-shadow-sm sm:size-24" />
          </div>

          <p className="text-kicker">Extração em andamento</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Estamos transformando o PDF em painel.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pode levar alguns instantes. Esta página se atualiza sozinha quando
            o laudo estiver pronto para revisão.
          </p>

          <div className="mt-5 flex max-w-full items-center gap-2 rounded-xl bg-brand-cream-soft px-3 py-2 text-xs text-muted-foreground ring-1 ring-border">
            <FileSearch className="size-4 shrink-0 text-brand-green-strong" />
            <span className="truncate font-mono">{fileName}</span>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-background/70 p-4 shadow-sm">
          <div className="min-h-36">
            <div className="flex items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/20 text-brand-green-strong">
                <tip.Icon className="size-4.5" strokeWidth={2.25} />
              </span>
              <p className="text-kicker">Enquanto isso</p>
            </div>

            <div key={tip.title} className="extraction-tip-enter mt-4 space-y-2">
              <h3 className="text-base font-semibold tracking-tight">
                {tip.title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {tip.text}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2 rounded-xl bg-muted/45 px-3 py-2"
              >
                <span
                  className={cn(
                    "extraction-step-dot size-2 shrink-0 rounded-full bg-brand-green-strong",
                    index === 1 && "[animation-delay:0.35s]",
                    index === 2 && "[animation-delay:0.7s]",
                    index === 3 && "[animation-delay:1.05s]",
                  )}
                  aria-hidden
                />
                <span className="text-xs font-medium text-foreground/80">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
