import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";

// Rate limiting fixed-window em Postgres (auditoria 2026-07). Sem Redis: o
// upsert atômico de 1 statement funciona no driver neon-http (sem transação
// interativa) e não adiciona infra nova. Custo: 1 roundtrip Neon (~10-30ms) —
// irrelevante nas rotas protegidas (IA leva segundos; login já consulta o
// banco).
//
// Fail-open: erro de banco NUNCA derruba a rota protegida (disponibilidade >
// rigor no beta). O pior caso é uma janela sem limite, não um produto fora do
// ar.

/**
 * Conta +1 na janela corrente da chave `{scope}:{id}` e diz se ainda está
 * dentro do limite. Janela fixa: o início é o timestamp truncado ao múltiplo
 * de `janelaMs`, então todas as instâncias serverless concordam sem
 * coordenação.
 */
export async function checarLimite(
  scope: string,
  id: string,
  limite: number,
  janelaMs: number,
): Promise<boolean> {
  const key = `${scope}:${id}`;
  const windowStart = new Date(Math.floor(Date.now() / janelaMs) * janelaMs);

  try {
    const result = await db.execute(sql`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < ${windowStart} THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = GREATEST(rate_limits.window_start, ${windowStart})
      RETURNING count
    `);
    const count = Number(result.rows[0]?.count ?? 0);
    return count <= limite;
  } catch (err) {
    console.error("[rate-limit] falha ao checar limite (fail-open):", err);
    return true;
  }
}

/**
 * IP do cliente atrás do proxy da Vercel: primeiro hop do x-forwarded-for
 * (a Vercel preenche e não deixa o cliente forjar o primeiro), fallback
 * x-real-ip. "desconhecido" agrupa o resto numa chave só — melhor limitar
 * junto do que não limitar.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "desconhecido";
}
