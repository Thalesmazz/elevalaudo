"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Gráfico da timeline (P5 `equipamento-timeline`): barras empilhadas da
 * contagem de não-conformidades por severidade, uma barra por inspeção no tempo.
 * A altura da barra = total de NCs; a cor mostra a composição (urgente/atenção/
 * leve). Sai do "foto" pro "filme" — dá pra ver a evolução num relance.
 *
 * As cores reusam o vocabulário RAG do `status.ts` (vermelho/âmbar/zinco).
 * Recharts precisa de hex literal (SVG), então fica fixo aqui — mas casado com a
 * paleta do dashboard.
 */

export type TimelinePontoChart = {
  dataCurta: string;
  dataLabel: string;
  urgente: number;
  atencao: number;
  leve: number;
  total: number;
  dataEstimada: boolean;
};

const COR = {
  urgente: "#ef4444",
  atencao: "#f59e0b",
  leve: "#a1a1aa",
} as const;

type TooltipPayloadItem = {
  name: string;
  value: number;
  dataKey: string;
  color: string;
  payload: TimelinePontoChart;
};

function TimelineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0]?.payload as TimelinePontoChart | undefined;
  const linhas = payload.filter((p) => p.value > 0);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">
        {ponto?.dataLabel ?? label}
        {ponto?.dataEstimada ? (
          <span className="ml-1 text-muted-foreground">(publicação)</span>
        ) : null}
      </p>
      {linhas.length === 0 ? (
        <p className="text-muted-foreground">Sem não-conformidades</p>
      ) : (
        <ul className="space-y-0.5">
          {linhas.map((p) => (
            <li key={p.dataKey} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: p.color }}
              />
              <span className="capitalize text-muted-foreground">
                {p.name}
              </span>
              <span className="ml-auto font-mono font-medium text-popover-foreground">
                {p.value}
              </span>
            </li>
          ))}
          <li className="mt-1 flex items-center gap-1.5 border-t border-border pt-1">
            <span className="text-muted-foreground">Total</span>
            <span className="ml-auto font-mono font-medium text-popover-foreground">
              {ponto?.total}
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}

export function TimelineChart({ data }: { data: TimelinePontoChart[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
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
            dataKey="dataCurta"
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
            content={<TimelineTooltip />}
          />
          {/* isAnimationActive=false: a barra desenha na hora, sem depender de
              requestAnimationFrame (que é throttled em preview/print/PDF e
              deixaria a barra em altura 0). Render confiável > animação de
              entrada num gráfico de relatório. */}
          <Bar
            dataKey="leve"
            name="Leve"
            stackId="nc"
            fill={COR.leve}
            isAnimationActive={false}
          />
          <Bar
            dataKey="atencao"
            name="Atenção"
            stackId="nc"
            fill={COR.atencao}
            isAnimationActive={false}
          />
          <Bar
            dataKey="urgente"
            name="Urgente"
            stackId="nc"
            fill={COR.urgente}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
