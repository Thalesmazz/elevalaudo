import {
  estimarCompliance,
  resolverCidade,
  type ComplianceEstimativa,
} from "@/lib/compliance";
import type { LaudoExtraido } from "@/lib/schema/laudo";

/**
 * Alerta de prazo do RIA por email (P5 `alerta-prazo-ria-email`, ADR-008).
 *
 * Este arquivo é a LÓGICA PURA (sem rede, sem DB, sem `server-only`): dado um
 * conjunto de laudos publicados, decide quais estão `vencendo`/`vencido` e monta
 * o HTML do digest. Reusa `estimarCompliance` (P3) — a regra de prazo do RIA
 * mora num lugar só (DRY). O transporte (query + Resend) fica em
 * `alerta-ria-runner.ts`.
 *
 * Liability (ADR-002 / NEVER-DO): o email COMUNICA uma estimativa. Reusa o
 * `resumo` do compliance (já marcado como estimativa) e NUNCA afirma multa ou
 * obrigação como fato.
 */

/** Laudo publicado, na forma mínima que o alerta precisa. */
export type LaudoPublicado = {
  id: string;
  shareToken: string | null;
  extracao: LaudoExtraido;
};

/** Um item do digest: o laudo + a estimativa de compliance que o qualificou. */
export type AlertaItem = {
  laudoId: string;
  shareToken: string | null;
  predioNome: string;
  /** Estimativa que disparou o alerta (status `vencendo` ou `vencido`). */
  compliance: ComplianceEstimativa;
};

/** Status que disparam alerta — em dia / sem data não geram email. */
function deveAlertar(c: ComplianceEstimativa): boolean {
  return c.status === "vencendo" || c.status === "vencido";
}

/**
 * Seleciona os laudos que merecem alerta e ordena por urgência (mais vencido /
 * mais perto de vencer primeiro). `hoje` é injetável pra teste determinístico.
 */
export function selecionarAlertas(
  laudos: LaudoPublicado[],
  hoje: Date = new Date(),
): AlertaItem[] {
  return laudos
    .map((l): AlertaItem => {
      const cidade = resolverCidade(l.extracao.predio?.endereco);
      const compliance = estimarCompliance(
        l.extracao.dataInspecao,
        cidade,
        hoje,
      );
      return {
        laudoId: l.id,
        shareToken: l.shareToken,
        predioNome: l.extracao.predio?.nome ?? "Prédio sem nome",
        compliance,
      };
    })
    .filter((a) => deveAlertar(a.compliance))
    .sort(
      (a, b) =>
        (a.compliance.diasRestantes ?? 0) - (b.compliance.diasRestantes ?? 0),
    );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const COR_STATUS: Record<"vencendo" | "vencido", string> = {
  vencendo: "#b45309", // amber-700
  vencido: "#b91c1c", // red-700
};

/** Linha de um item no email. */
function itemHtml(item: AlertaItem, baseUrl: string): string {
  const status = item.compliance.status as "vencendo" | "vencido";
  const cor = COR_STATUS[status];
  const label = status === "vencido" ? "RIA vencido" : "RIA vence em breve";
  const link = item.shareToken
    ? `${baseUrl}/r/${item.shareToken}`
    : `${baseUrl}/laudos/${item.laudoId}`;
  return `
    <tr>
      <td style="padding:16px 0;border-top:1px solid #e4e4e7;">
        <div style="font-weight:600;color:#18181b;font-size:15px;">${escapeHtml(
          item.predioNome,
        )}</div>
        <div style="margin-top:4px;display:inline-block;font-size:12px;font-weight:600;color:${cor};">
          ${label}
        </div>
        <div style="margin-top:8px;color:#52525b;font-size:14px;line-height:1.5;">${escapeHtml(
          item.compliance.resumo,
        )}</div>
        <a href="${link}" style="display:inline-block;margin-top:10px;color:#0a5c3a;font-size:14px;font-weight:600;text-decoration:none;">Ver laudo &rarr;</a>
      </td>
    </tr>`;
}

/** Assunto do digest, conforme a contagem de vencidos/vencendo. */
export function montarAssunto(itens: AlertaItem[]): string {
  const vencidos = itens.filter(
    (i) => i.compliance.status === "vencido",
  ).length;
  const n = itens.length;
  if (vencidos > 0) {
    return `ElevaLaudo · ${vencidos} RIA vencido${vencidos === 1 ? "" : "s"} e ${n} prazo${n === 1 ? "" : "s"} a acompanhar`;
  }
  return `ElevaLaudo · ${n} RIA${n === 1 ? "" : "s"} vencendo em breve`;
}

/** Monta o HTML completo do digest. `baseUrl` sem barra no fim. */
export function montarEmailHtml(itens: AlertaItem[], baseUrl: string): string {
  const linhas = itens.map((i) => itemHtml(i, baseUrl)).join("");
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;background:#fafafa;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:18px;font-weight:700;color:#0a5c3a;">ElevaLaudo</div>
    <h1 style="font-size:20px;color:#18181b;margin:16px 0 4px;">Prazos de RIA pra acompanhar</h1>
    <p style="color:#52525b;font-size:14px;line-height:1.5;margin:0 0 8px;">
      Estes laudos têm o RIA (Relatório de Inspeção Anual) vencido ou vencendo nos próximos 60 dias.
      Vale agendar a renovação da inspeção e o envio à prefeitura.
    </p>
    <table style="width:100%;border-collapse:collapse;">${linhas}</table>
    <p style="margin-top:24px;color:#a1a1aa;font-size:12px;line-height:1.5;border-top:1px solid #e4e4e7;padding-top:16px;">
      Os prazos são <strong>estimativas</strong> calculadas a partir da data de inspeção do laudo
      (inspeção + validade anual). A obrigação e o prazo do RIA variam por município — confirme com a prefeitura
      e com o responsável técnico. O ElevaLaudo comunica, não certifica.
    </p>
  </div>
</body>
</html>`;
}
