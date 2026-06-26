import {
  OctagonAlert,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

/**
 * Fonte da verdade visual do sistema RAG (verde/amarelo/vermelho).
 *
 * - `statusConfig` → leitura agregada do laudo (hero, P3 `dashboard-semaforo-hero`).
 * - `severidadeConfig` → por não-conformidade (lista rankeada, P3 `dashboard-nc-ranked`).
 *
 * Liability (ADR-002): o produto COMUNICA o que o laudo diz, não certifica
 * segurança. As frases abaixo são leitura do laudo, nunca atestado.
 */

export const STATUS_ORDER = ["seguro", "atencao", "urgente"] as const;
export type StatusGeral = (typeof STATUS_ORDER)[number];

type StatusEntry = {
  /** Palavra grande do hero. */
  label: string;
  /** Posição no semáforo (0 = topo verde, 2 = base vermelho). */
  index: 0 | 1 | 2;
  Icon: LucideIcon;
  /** Cor do texto/ícone do status ativo. */
  accent: string;
  /** Disco aceso (cor cheia + brilho). */
  lampOn: string;
  /** Disco apagado dentro do semáforo. */
  lampDim: string;
  /** Leitura do laudo em PT de gente. Liability-safe. */
  message: string;
};

export const statusConfig: Record<StatusGeral, StatusEntry> = {
  seguro: {
    label: "Seguro",
    index: 0,
    Icon: ShieldCheck,
    accent: "text-emerald-600 dark:text-emerald-400",
    lampOn: "bg-emerald-500 shadow-[0_0_44px_10px_rgba(16,185,129,0.55)]",
    lampDim: "bg-emerald-500/15",
    message: "O laudo não aponta pendências relevantes.",
  },
  atencao: {
    label: "Atenção",
    index: 1,
    Icon: TriangleAlert,
    accent: "text-amber-600 dark:text-amber-400",
    lampOn: "bg-amber-400 shadow-[0_0_44px_10px_rgba(251,191,36,0.55)]",
    lampDim: "bg-amber-400/15",
    message: "Há não-conformidades a corrigir dentro do prazo.",
  },
  urgente: {
    label: "Urgente",
    index: 2,
    Icon: OctagonAlert,
    accent: "text-red-600 dark:text-red-400",
    lampOn: "bg-red-500 shadow-[0_0_44px_10px_rgba(239,68,68,0.6)]",
    lampDim: "bg-red-500/15",
    message: "Risco apontado no laudo. Recomenda-se ação imediata.",
  },
};

/** Severidade por não-conformidade. Reusa o vocabulário de cor do hero. */
export const severidadeConfig: Record<
  "urgente" | "atencao" | "leve",
  { label: string; Icon: LucideIcon; pill: string }
> = {
  urgente: {
    label: "Urgente",
    Icon: OctagonAlert,
    pill: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-400",
  },
  atencao: {
    label: "Atenção",
    Icon: TriangleAlert,
    pill: "bg-amber-400/10 text-amber-700 ring-amber-500/25 dark:text-amber-400",
  },
  leve: {
    label: "Leve",
    Icon: ShieldCheck,
    pill: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400",
  },
};
