import "server-only";

import { generateObject } from "ai";
import { extractText, getDocumentProxy } from "unpdf";

import { laudoSchema, type LaudoExtraido } from "@/lib/schema/laudo";

// Extração de laudo (ADR-003). Sempre generateObject + LaudoSchema — nunca
// chamar o modelo sem schema (NEVER-DO). Opus pela qualidade do parse.
// Autenticação no AI Gateway é automática via VERCEL_OIDC_TOKEN.
const MODELO_EXTRACAO = "anthropic/claude-opus-4.8";

// Abaixo disto consideramos o PDF "escaneado" (sem camada de texto útil) e
// mandamos o arquivo direto pro modelo (visão), sem OCR separado.
const MIN_CHARS_TEXTO = 100;

export type ModoExtracao = "texto" | "visao";

export type ResultadoExtracao = {
  data: LaudoExtraido;
  modo: ModoExtracao;
};

const SYSTEM = `Você extrai dados de laudos de inspeção de elevador brasileiros (NBR 16858) para um objeto estruturado.

Regras inegociáveis:
- EXTRAIR, NÃO INVENTAR. Use apenas o que está no laudo. Campo ausente → omita (não preencha com palpite, "N/A" ou valor inventado).
- Severidade vem do laudo. Se ambíguo, use "atencao".
- NÃO afirme conformidade legal nem segurança como fato — "statusGeral" é leitura do laudo, não atestado.
- Preserve o nome e o CREA do responsável técnico.
- "plainPt": explique cada não-conformidade em português de gente, para um síndico leigo, sem jargão e sem inventar dado novo.
- Tudo em português do Brasil.`;

const INSTRUCAO =
  "Extraia os dados deste laudo de inspeção de elevador conforme o schema. Não invente nada que não esteja no documento.";

/**
 * Lê o texto embutido no PDF com unpdf. PDF texto puro → manda texto (barato);
 * escaneado → manda o PDF direto pro modelo (visão).
 */
export async function extrairLaudoDePdf(
  pdf: Uint8Array,
): Promise<ResultadoExtracao> {
  const texto = await preExtrairTexto(pdf);
  const modo: ModoExtracao =
    texto.replace(/\s/g, "").length >= MIN_CHARS_TEXTO ? "texto" : "visao";

  const { object } = await generateObject({
    model: MODELO_EXTRACAO,
    schema: laudoSchema,
    system: SYSTEM,
    messages: [
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
    ],
  });

  return { data: object, modo };
}

async function preExtrairTexto(pdf: Uint8Array): Promise<string> {
  try {
    const doc = await getDocumentProxy(pdf);
    const { text } = await extractText(doc, { mergePages: true });
    return text;
  } catch {
    // PDF ilegível pelo parser → trata como escaneado (cai pra visão).
    return "";
  }
}
