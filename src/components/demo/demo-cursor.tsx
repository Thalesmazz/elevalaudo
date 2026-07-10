"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
  type RefObject,
} from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { MousePointer2 } from "lucide-react";

/**
 * Cursor-fantasma da demo interativa (ver ADR-009). Move-se em % relativas ao
 * frame da "janela de navegador" e sabe mirar em elementos reais do DOM — é
 * assim que a cena de dashboard consegue clicar de verdade nos toggles do
 * `NcCharts` (componente real, não mockado).
 */
export type DemoCursorApi = {
  moveToPercent: (x: number, y: number) => Promise<void>;
  moveToEl: (el: Element | null) => Promise<void>;
  pulse: () => Promise<void>;
  show: () => void;
  hide: () => void;
};

const DemoCursorContext = createContext<DemoCursorApi | null>(null);

export function useDemoCursor(): DemoCursorApi {
  const ctx = useContext(DemoCursorContext);
  if (!ctx) {
    throw new Error("useDemoCursor precisa estar dentro de DemoCursorProvider");
  }
  return ctx;
}

export function DemoCursorProvider({
  frameRef,
  reducedMotion,
  children,
}: {
  frameRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0);

  const moveToPercent = useCallback(
    async (targetX: number, targetY: number) => {
      if (reducedMotion) {
        x.set(targetX);
        y.set(targetY);
        return;
      }
      await Promise.all([
        animate(x, targetX, { duration: 0.7, ease: "easeInOut" }),
        animate(y, targetY, { duration: 0.7, ease: "easeInOut" }),
      ]);
    },
    [reducedMotion, x, y],
  );

  const moveToEl = useCallback(
    async (el: Element | null) => {
      const frame = frameRef.current;
      if (!el || !frame) return;
      const elRect = el.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      if (frameRect.width === 0 || frameRect.height === 0) return;
      const px =
        ((elRect.left + elRect.width / 2 - frameRect.left) / frameRect.width) *
        100;
      const py =
        ((elRect.top + elRect.height / 2 - frameRect.top) / frameRect.height) *
        100;
      await moveToPercent(px, py);
    },
    [frameRef, moveToPercent],
  );

  const pulse = useCallback(async () => {
    if (reducedMotion) return;
    await animate(scale, 0.72, { duration: 0.12, ease: "easeOut" });
    await animate(scale, 1, { duration: 0.22, ease: "easeOut" });
  }, [reducedMotion, scale]);

  const show = useCallback(() => {
    if (reducedMotion) return;
    animate(opacity, 1, { duration: 0.3 });
  }, [reducedMotion, opacity]);

  const hide = useCallback(() => {
    animate(opacity, 0, { duration: 0.25 });
  }, [opacity]);

  const left = useTransform(x, (v) => `${v}%`);
  const top = useTransform(y, (v) => `${v}%`);

  const api = useMemo<DemoCursorApi>(
    () => ({ moveToPercent, moveToEl, pulse, show, hide }),
    [moveToPercent, moveToEl, pulse, show, hide],
  );

  return (
    <DemoCursorContext.Provider value={api}>
      {children}
      {!reducedMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute z-20"
          style={{ left, top, opacity, scale, translateX: "-4px", translateY: "-4px" }}
        >
          <MousePointer2
            className="size-5 fill-foreground/90 text-background drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
            strokeWidth={1.5}
          />
        </motion.div>
      ) : null}
    </DemoCursorContext.Provider>
  );
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
