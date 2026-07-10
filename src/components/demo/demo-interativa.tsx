"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, MousePointerClick, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { DemoCursorProvider } from "@/components/demo/demo-cursor";
import { DEMO_CENAS } from "@/components/demo/demo-data";
import {
  SceneDashboard,
  SceneExtracao,
  SceneLista,
  SceneUpload,
} from "@/components/demo/demo-scenes";

const SCENE_COMPONENTS = {
  upload: SceneUpload,
  extracao: SceneExtracao,
  dashboard: SceneDashboard,
  lista: SceneLista,
} as const;

/**
 * Demo interativa "sem conta" da landing (ver ADR-009). Um cursor-fantasma
 * percorre em loop 4 telas reais do produto — upload, extração, dashboard
 * (gráficos reais do `NcCharts`) e a lista geral de laudos — alimentadas com
 * dados fictícios. Pausar a demo (botão ou clique numa seta) congela o piloto
 * automático e libera os controles reais da cena atual (toggle de gráfico,
 * dropzone, abas) pro visitante mexer.
 */
export function DemoInterativa() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const cena = DEMO_CENAS[index];
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % DEMO_CENAS.length);
    }, cena.duracaoMs);
    return () => window.clearTimeout(timer);
  }, [index, playing, reducedMotion]);

  function goTo(next: number) {
    setIndex((next + DEMO_CENAS.length) % DEMO_CENAS.length);
  }

  // Qualquer clique de verdade dentro da demo (setas, pontos, ou os controles
  // reais da cena — toggle de gráfico, dropzone, abas, abrir laudo) pausa o
  // piloto automático: o visitante assumiu o controle. `isTrusted` distingue
  // esse clique real do clique PROGRAMÁTICO que o próprio cursor-fantasma
  // dispara (`.click()` no toggle/aba) durante o piloto automático — sem essa
  // checagem a demo se auto-pausaria a cada passo do script. O botão
  // play/pause fica de fora da regra pra poder retomar a reprodução.
  function handleAnyClick(e: MouseEvent) {
    if (!e.nativeEvent.isTrusted) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-demo-playpause]")) return;
    setPlaying(false);
  }

  const cena = DEMO_CENAS[index];
  const Scene = SCENE_COMPONENTS[cena.id];

  return (
    <div className="mx-auto w-full max-w-4xl" onClickCapture={handleAnyClick}>
      <div
        className={cn(
          "surface-panel relative overflow-hidden rounded-3xl transition-shadow",
          !playing && "ring-2 ring-brand-green-strong/45",
        )}
      >
        {/* barra superior estilo navegador */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
            {cena.url}
          </span>
          {!playing ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-green/15 px-2 py-0.5 text-[0.65rem] font-medium text-brand-green-strong">
              Pausada · interativa
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-[0.65rem] text-muted-foreground/70",
                !reducedMotion && "animate-pulse",
              )}
            >
              <MousePointerClick className="size-3" strokeWidth={2} />
              Clique para interagir
            </span>
          )}
        </div>

        <div ref={frameRef} className="relative h-[36rem] overflow-hidden sm:h-[34rem]">
          <DemoCursorProvider frameRef={frameRef} reducedMotion={reducedMotion}>
            <AnimatePresence mode="wait">
              <motion.div
                key={cena.id}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Scene reducedMotion={reducedMotion} playing={playing} />
              </motion.div>
            </AnimatePresence>
          </DemoCursorProvider>
        </div>
      </div>

      {/* controles — fora da janela da demo, no tom verde da marca */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Cena anterior"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green-strong transition-colors hover:bg-brand-green/25 focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <ChevronLeft className="size-5" strokeWidth={2.25} />
        </button>

        <button
          type="button"
          data-demo-playpause
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pausar demo" : "Retomar demo"}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm transition-all active:translate-y-px",
            playing
              ? "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),black_12%)]"
              : "bg-amber-400 text-amber-950 hover:bg-amber-300",
          )}
        >
          {playing ? (
            <>
              <Pause className="size-4" strokeWidth={2.5} />
              Pausar
            </>
          ) : (
            <>
              <Play className="size-4" strokeWidth={2.5} />
              Retomar
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {DEMO_CENAS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir para a cena ${i + 1}`}
              aria-current={i === index}
              className="flex items-center justify-center p-2"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-brand-green-strong" : "w-1.5 bg-border",
                )}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Próxima cena"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-green/15 text-brand-green-strong transition-colors hover:bg-brand-green/25 focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <ChevronRight className="size-5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
