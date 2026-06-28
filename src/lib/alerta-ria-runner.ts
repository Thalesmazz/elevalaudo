import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos, producers } from "@/db/schema";
import {
  montarAssunto,
  montarEmailHtml,
  selecionarAlertas,
  type AlertaItem,
  type LaudoPublicado,
} from "@/lib/alerta-ria";
import { enviarEmail } from "@/lib/email/resend";

/**
 * Runner do alerta de prazo do RIA (P5 `alerta-prazo-ria-email`, ADR-008):
 * o lado com efeito colateral (DB + email). A decisão de quem alertar é pura,
 * em `alerta-ria.ts`. Chamado pelo cron `/api/cron/alerta-ria`.
 *
 * Liability (ADR-002): só laudo `publicado` entra (igual à timeline e ao link
 * público). Sem destinatário ou sem Resend configurado → no-op (não quebra).
 */

const APP_URL = (
  process.env.ELEVALAUDO_APP_URL ?? "https://elevalaudo.vercel.app"
).replace(/\/$/, "");

export type AlertaResultado = {
  /** Laudos publicados examinados. */
  examinados: number;
  /** Itens que disparariam alerta (vencendo/vencido). */
  alertas: number;
  /** Email efetivamente enviado? (false = sem destinatário/Resend). */
  enviado: boolean;
  /** Motivo de não ter enviado, quando aplicável. */
  motivo?: string;
};

/** Destinatário: email do produtor singleton, com fallback de env (teste). */
async function resolverDestinatario(): Promise<string | null> {
  const [producer] = await db
    .select({ email: producers.email })
    .from(producers)
    .limit(1);
  return producer?.email?.trim() || process.env.ALERTA_EMAIL_TO?.trim() || null;
}

/** Carrega os laudos publicados com extração, na forma mínima do alerta. */
async function carregarPublicados(): Promise<LaudoPublicado[]> {
  const rows = await db
    .select({
      id: laudos.id,
      shareToken: laudos.shareToken,
      extracao: laudos.extracao,
    })
    .from(laudos)
    .where(eq(laudos.status, "publicado"));

  return rows
    .filter((r): r is LaudoPublicado => r.extracao !== null)
    .map((r) => ({
      id: r.id,
      shareToken: r.shareToken,
      extracao: r.extracao,
    }));
}

export async function dispararAlertaRia(
  hoje: Date = new Date(),
): Promise<AlertaResultado> {
  const publicados = await carregarPublicados();
  const itens: AlertaItem[] = selecionarAlertas(publicados, hoje);

  const base: AlertaResultado = {
    examinados: publicados.length,
    alertas: itens.length,
    enviado: false,
  };

  if (itens.length === 0) {
    return { ...base, motivo: "nenhum laudo vencendo ou vencido" };
  }

  const para = await resolverDestinatario();
  if (!para) {
    return { ...base, motivo: "sem destinatário (configure email em /produtor)" };
  }

  const enviado = await enviarEmail({
    para,
    assunto: montarAssunto(itens),
    html: montarEmailHtml(itens, APP_URL),
  });

  return {
    ...base,
    enviado,
    motivo: enviado ? undefined : "RESEND_API_KEY ausente",
  };
}
