"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartColumn, ChartLine } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Gráficos de não-conformidades em 2 tipos (barra empilhada, linha) sobre o
 * MESMO dataset — usado no modal de gráficos sob demanda (laudos
 * selecionados pelo usuário) e reaproveitável na timeline do prédio.
 *
 * Sem pizza: com só 3 fatias (urgente/atenção/leve) o donut não comunica mais
 * que a barra empilhada, e falha o teste de mais de 1 inspeção (pizza não tem
 * eixo do tempo). Barra/linha cobrem comparação e tendência — os dois casos
 * de uso reais do produto.
 *
 * Cores: paleta RAG fixa (urgente/atenção/leve) — recharts é SVG e precisa de
 * hex literal. Mantém o vocabulário do semáforo (status.ts): honestidade visual
 * acima da cor de marca.
 */

const COR = {
  urgente: "#ef4444",
  atencao: "#f59e0b",
  leve: "#a1a1aa",
} as const;

export type NcPonto = {
  /** Rótulo do eixo X (ex.: data da inspeção ou nome curto do laudo). */
  rotulo: string;
  urgente: number;
  atencao: number;
  leve: number;
  total: number;
};

type Tipo = "barra" | "linha";

const TIPOS: { value: Tipo; label: string; Icon: typeof ChartColumn }[] = [
  { value: "barra", label: "Barra", Icon: ChartColumn },
  { value: "linha", label: "Linha", Icon: ChartLine },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label ? (
        <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload
          .filter((p) => (p.value ?? 0) > 0)
          .map((p, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: p.color }}
              />
              <span className="capitalize text-muted-foreground">{p.name}</span>
              <span className="ml-auto font-mono font-medium text-popover-foreground">
                {p.value}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function NcCharts({
  data,
  className,
  heightClassName = "h-72",
}: {
  data: NcPonto[];
  className?: string;
  /** Sobrescreve a altura do gráfico (ex.: `h-48` num contexto mais compacto). */
  heightClassName?: string;
}) {
  const [tipo, setTipo] = useState<Tipo>("barra");

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-end gap-1">
        {TIPOS.map((t) => {
          const ativo = tipo === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
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

      <div className={cn("w-full", heightClassName)}>
        <ResponsiveContainer width="100%" height="100%">
          {tipo === "barra" ? (
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-border"
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="rotulo"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
                width={40}
              />
              <Tooltip
                cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="leve" name="Leve" stackId="nc" fill={COR.leve} isAnimationActive={false} />
              <Bar dataKey="atencao" name="Atenção" stackId="nc" fill={COR.atencao} isAnimationActive={false} />
              <Bar dataKey="urgente" name="Urgente" stackId="nc" fill={COR.urgente} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-border"
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="rotulo"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                stroke="currentColor"
                className="text-muted-foreground"
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="urgente" name="Urgente" stroke={COR.urgente} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="atencao" name="Atenção" stroke={COR.atencao} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="leve" name="Leve" stroke={COR.leve} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
