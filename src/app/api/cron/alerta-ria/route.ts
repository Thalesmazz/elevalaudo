import { lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { rateLimits, sessions } from "@/db/schema";
import { dispararAlertaRia } from "@/lib/alerta-ria-runner";

/**
 * Cron do alerta de prazo do RIA (P5 `alerta-prazo-ria-email`, ADR-008).
 *
 * Agendado em `vercel.json` (1×/dia). A Vercel injeta o header
 * `Authorization: Bearer ${CRON_SECRET}` — exigimos isso pra ninguém disparar o
 * email de fora. Sem o secret configurado em prod, recusa (fail-closed).
 *
 * `force-dynamic`: nunca cachear; sempre consulta o estado atual dos laudos.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (process.env.VERCEL_ENV === "production") {
    // Em produção sem secret = configuração incompleta; não roda às cegas.
    return new Response("CRON_SECRET não configurado", { status: 500 });
  }

  const resultado = await dispararAlertaRia();

  // Higiene diária (auditoria 2026-07): sessões vencidas e janelas velhas de
  // rate limit não têm outro coletor. Falha aqui não derruba o alerta.
  try {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, sql`now() - interval '1 day'`));
  } catch (err) {
    console.error("[cron] limpeza de sessions/rate_limits falhou:", err);
  }

  return Response.json(resultado);
}
