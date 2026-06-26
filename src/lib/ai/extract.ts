import "server-only";

import { generateObject, type ModelMessage } from "ai";
import { extractText, getDocumentProxy } from "unpdf";

import { laudoSchema, type LaudoExtraido } from "@/lib/schema/laudo";

// Extração de laudo (ADR-003). Sempre generateObject + LaudoSchema — nunca
// chamar o modelo sem schema (NEVER-DO). Autenticação no AI Gateway é
// automática via VERCEL_OIDC_TOKEN.
//
// Escopo = 1 formato fixo (modelo RIA/INSS), então um modelo barato + system
// prompt que conhece o layout extrai tão bem quanto um grande. Padrão: haiku
// (barato, rápido, e roda no free-tier). Fallback: opus pra laudo difícil /
// escaneado ruim. Ambos sobrescrevíveis por env.
const MODELO_PRIMARIO =
  process.env.ELEVALAUDO_MODEL ?? "anthropic/claude-haiku-4.5";
const MODELO_FALLBACK =
  process.env.ELEVALAUDO_MODEL_FALLBACK ?? "anthropic/claude-opus-4.8";

// Abaixo disto consideramos o PDF "escaneado" (sem camada de texto útil) e
// mandamos o arquivo direto pro modelo (visão), sem OCR separado.
const MIN_CHARS_TEXTO = 100;

export type ModoExtracao = "texto" | "visao";

export type ResultadoExtracao = {
  data: LaudoExtraido;
  modo: ModoExtracao;
  modelo: string;
};

const SYSTEM = `Você extrai dados de laudos de inspeção anual de elevador brasileiros (RIA, ABNT NBR 16858) para um objeto estruturado.

Formato esperado do laudo:
- Cabeçalho com dados do prédio/condomínio (contratante), empresa conservadora e responsável técnico (inspetor) com CREA.
- Um ou mais equipamentos (elevadores), cada um com identificação, modelo e tipo (elétrico de tração / hidráulico).
- Um checklist de itens de inspeção numerados (ex: 2.18, 5.9) marcados como Aprovado, Reprovado ou Não aplicável, com coluna de Observações.
- Conclusão / parecer e data da inspeção.

Como mapear:
- Capture o endereço completo do prédio com CIDADE e UF (estado) — aparece no cabeçalho (contratante/proprietário). É essencial para identificar a cidade e a lei municipal do RIA. Não omita a cidade/UF se estiverem visíveis.
- Cada item REPROVADO é uma não-conformidade. Use o texto do item como "descricao", o número do item (ex: "2.18") como "itemNbr" e a Observação para extrair "acao" e "prazo".
- Itens Aprovados ou Não aplicáveis NÃO são não-conformidades — ignore.

Regras inegociáveis:
- EXTRAIR, NÃO INVENTAR. Use apenas o que está no laudo. Campo ausente → omita (não preencha com palpite, "N/A" ou valor inventado).
- Severidade vem do laudo (palavras como "imediato"/"risco de rompimento" → urgente; prazo curto → atencao). Se ambíguo, use "atencao".
- NÃO afirme conformidade legal nem segurança como fato — "statusGeral" é leitura do laudo, não atestado.
- Preserve o nome e o CREA do responsável técnico.
- "plainPt": explique cada não-conformidade em português de gente, para um síndico leigo, sem jargão e sem inventar dado novo.
- Tudo em português do Brasil.`;

const INSTRUCAO =
  "Extraia os dados deste laudo de inspeção de elevador conforme o schema. Não invente nada que não esteja no documento.";

/**
 * Lê o texto embutido no PDF com unpdf. PDF texto puro → manda texto (barato);
 * escaneado → manda o PDF direto pro modelo (visão). Tenta o modelo primário
 * (haiku) e, em falha, cai pro fallback (opus).
 */
export async function extrairLaudoDePdf(
  pdf: Uint8Array,
): Promise<ResultadoExtracao> {
  const texto = await preExtrairTexto(pdf);
  const modo: ModoExtracao =
    texto.replace(/\s/g, "").length >= MIN_CHARS_TEXTO ? "texto" : "visao";

  const messages: ModelMessage[] = [
    {
      role: "user",
      content:
        modo === "texto"
          ? [{ type: "text", text: `${INSTRUCAO}\n\n---\n${texto}` }]
          : [
              { type: "text", text: INSTRUCAO },
              {
                type: "file",
                mediaType: "application/pdf",
                data: pdf,
                filename: "laudo.pdf",
              },
            ],
    },
  ];

  try {
    const data = await gerar(MODELO_PRIMARIO, messages);
    return { data, modo, modelo: MODELO_PRIMARIO };
  } catch (err) {
    if (MODELO_FALLBACK === MODELO_PRIMARIO) throw err;
    // Laudo difícil pro modelo barato → tenta o grande.
    const data = await gerar(MODELO_FALLBACK, messages);
    return { data, modo, modelo: MODELO_FALLBACK };
  }
}

async function gerar(
  model: string,
  messages: ModelMessage[],
): Promise<LaudoExtraido> {
  const { object } = await generateObject({
    model,
    schema: laudoSchema,
    system: SYSTEM,
    messages,
  });
  return object;
}

async function preExtrairTexto(pdf: Uint8Array): Promise<string> {
  try {
    // pdf.js DETACHA o ArrayBuffer que recebe (transfere pro worker). No modo
    // visão o mesmo `pdf` é reenviado pro modelo, então passamos uma CÓPIA aqui
    // (slice) pra preservar o buffer original — senão: "Cannot perform
    // %TypedArray%.prototype.values on a detached ArrayBuffer". Pega todo PDF
    // escaneado (modo visão).
    const doc = await getDocumentProxy(pdf.slice());
    const { text } = await extractText(doc, { mergePages: true });
    return text;
  } catch {
    // PDF ilegível pelo parser → trata como escaneado (cai pra visão).
    return "";
  }
}
