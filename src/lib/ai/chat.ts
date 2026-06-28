import "server-only";

import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import type { LaudoExtraido } from "@/lib/schema/laudo";

/**
 * "Pergunte ao laudo" — chat Q&A grounded no laudo (P5 `pergunte-ao-laudo-chat`).
 *
 * O síndico pergunta em PT de gente e a resposta sai SÓ do conteúdo extraído do
 * laudo (técnica de grounding: o laudo entra como contexto na system prompt e o
 * modelo é instruído a não usar nada de fora). Anti-alucinação é inegociável
 * aqui (NEVER-DO: "extrair, não inventar") — e por liability (ADR-002) o chat
 * comunica o que o laudo diz, NUNCA atesta segurança nem dá veredito de uso.
 *
 * Haiku porque é Q&A barato e de alto volume (mesma escolha do plain-PT). O
 * acesso é via AI Gateway por string; auth automática por VERCEL_OIDC_TOKEN.
 */
const MODELO_CHAT =
  process.env.ELEVALAUDO_CHAT_MODEL ?? "anthropic/claude-haiku-4.5";

function montarSystem(extracao: LaudoExtraido): string {
  return `Você é o assistente do ElevaLaudo. Responde perguntas de um síndico (leigo, sem formação técnica) SOMENTE com base no laudo de inspeção do elevador abaixo.

REGRAS INEGOCIÁVEIS:
- Use APENAS o que está no laudo abaixo. NÃO invente dados, prazos, custos, normas ou números que não estejam ali.
- Se a resposta não estiver no laudo, diga claramente que essa informação não consta no laudo — não chute.
- Responda em português do Brasil, em linguagem de gente, sem jargão técnico (se precisar citar um termo da norma, explique).
- Seja direto e curto. Pode usar listas quando ajudar.
- VOCÊ NÃO CERTIFICA SEGURANÇA. Não declare que o elevador "é seguro" nem dê veredito definitivo de "pode ou não pode usar" como se fosse atestado. Comunique o que o laudo aponta (status, não-conformidades, urgência) e, quando a pergunta for sobre risco/uso, lembre que a avaliação é do responsável técnico que assinou o laudo (${extracao.produtor.nome}${extracao.produtor.crea ? `, CREA ${extracao.produtor.crea}` : ""}).
- Nunca omita o nome do responsável técnico quando for relevante.

=== LAUDO (única fonte da verdade) ===
${laudoParaContexto(extracao)}
=== FIM DO LAUDO ===`;
}

/**
 * Serializa a extração num texto compacto e legível pro modelo. Determinístico
 * (sem chamada extra) — os dados já estão no `LaudoExtraido` persistido.
 */
function laudoParaContexto(e: LaudoExtraido): string {
  const linhas: string[] = [];

  linhas.push(`Prédio/condomínio: ${e.predio.nome}`);
  if (e.predio.endereco) linhas.push(`Endereço: ${e.predio.endereco}`);
  if (e.dataInspecao) linhas.push(`Data da inspeção: ${e.dataInspecao}`);
  linhas.push(
    `Responsável técnico: ${e.produtor.nome}${e.produtor.crea ? ` (CREA ${e.produtor.crea})` : ""}`,
  );
  linhas.push(
    `Status geral (leitura do laudo, não atestado): ${e.statusGeral}`,
  );

  for (const equip of e.equipamentos) {
    linhas.push("");
    linhas.push(
      `Equipamento: ${equip.identificacao}${equip.tipo ? ` — ${equip.tipo}` : ""}`,
    );
    if (equip.naoConformidades.length === 0) {
      linhas.push("  Sem não-conformidades apontadas.");
      continue;
    }
    equip.naoConformidades.forEach((nc, i) => {
      linhas.push(
        `  ${i + 1}. [${nc.severidade}]${nc.itemNbr ? ` (item ${nc.itemNbr})` : ""} ${nc.descricao}`,
      );
      if (nc.plainPt) linhas.push(`     Em PT de gente: ${nc.plainPt}`);
      linhas.push(`     O que fazer: ${nc.acao}`);
      if (nc.prazo) linhas.push(`     Prazo: ${nc.prazo}`);
    });
  }

  return linhas.join("\n");
}

/**
 * Recebe o histórico do chat (UIMessages do `useChat`) + a extração e devolve a
 * resposta em streaming (token a token — o "wow" do vídeo). O laudo vira a
 * system prompt; o modelo só responde a partir dele.
 */
export async function responderSobreLaudo(
  extracao: LaudoExtraido,
  messages: UIMessage[],
) {
  const result = streamText({
    model: MODELO_CHAT,
    system: montarSystem(extracao),
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
