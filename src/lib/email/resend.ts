import "server-only";

import { Resend } from "resend";

/**
 * Cliente de email (P5 `alerta-prazo-ria-email`, ADR-008).
 *
 * Resend porque é 1 dep + 1 chave, free-tier suficiente pro MVP/demo. Só o
 * transporte mora aqui — a regra de quando/o que enviar fica em
 * `lib/alerta-ria.ts` (lógica pura, testável sem rede).
 *
 * `from` precisa de domínio verificado no Resend pra mandar pra terceiros; em
 * teste usa o remetente de onboarding (só entrega pro dono da conta).
 */

const FROM_PADRAO = "ElevaLaudo <onboarding@resend.dev>";

/** Remetente configurável (domínio verificado em prod), com fallback de teste. */
export const EMAIL_FROM = process.env.ALERTA_EMAIL_FROM ?? FROM_PADRAO;

let cliente: Resend | null = null;

/**
 * Resend pronto pra usar, ou `null` se a chave não está configurada — o caller
 * trata como "email desligado" (no-op) em vez de quebrar o cron.
 */
export function getResend(): Resend | null {
  if (cliente) return cliente;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cliente = new Resend(key);
  return cliente;
}

export type EnvioEmail = {
  para: string;
  assunto: string;
  html: string;
};

/** Envia um email. Retorna `false` se o Resend não está configurado. */
export async function enviarEmail({
  para,
  assunto,
  html,
}: EnvioEmail): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: para,
    subject: assunto,
    html,
  });
  if (error) {
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
  return true;
}
