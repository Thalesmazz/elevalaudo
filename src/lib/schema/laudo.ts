import { z } from "zod";

/**
 * LaudoSchema — fonte da verdade do domínio ElevaLaudo (P1, espinha dorsal).
 *
 * Toda extração do Claude sai validada por este schema (generateObject + Zod).
 * P2 (revisão), P3 (dashboard) e P4 (share/PDF) dependem dele.
 *
 * Regras inegociáveis (NEVER-DO / ADR-003):
 * - **Extrair, não inventar** (Lei 1). Campo ausente no laudo → `optional`,
 *   NUNCA chutar valor.
 * - Severidade vem do laudo; se ambíguo, escalar pra `atencao` e marcar revisão.
 * - O produto comunica, não certifica. `statusGeral` é leitura do laudo, não
 *   atestado de segurança — a revisão humana (P2) é quem valida.
 *
 * As `.describe()` viram instrução pro modelo no generateObject — manter em
 * PT-BR e específicas.
 */

export const severidadeEnum = z
  .enum(["urgente", "atencao", "leve"])
  .describe(
    "Gravidade da não-conformidade conforme o laudo: 'urgente' (risco/parada iminente), 'atencao' (corrigir em prazo) ou 'leve' (menor). Se o laudo for ambíguo, use 'atencao'.",
  );

export const naoConformidadeSchema = z.object({
  descricao: z
    .string()
    .describe(
      "A não-conformidade exatamente como descrita no laudo (linguagem técnica). Não reescrever.",
    ),
  plainPt: z
    .string()
    .describe(
      "O que isso significa em português de gente, para um síndico leigo entender — sem jargão. Explica o risco/efeito prático, sem inventar dado novo.",
    ),
  severidade: severidadeEnum,
  itemNbr: z
    .string()
    .optional()
    .describe(
      "Item da NBR 16858 (ou outra norma) que embasa a não-conformidade, se o laudo citar. Ausente → omitir.",
    ),
  acao: z
    .string()
    .describe(
      "Ação corretiva recomendada pelo laudo. Se o laudo não especificar, descrever a correção evidente da própria não-conformidade, sem inventar prazo nem custo.",
    ),
  prazo: z
    .string()
    .optional()
    .describe(
      "Prazo para correção como consta no laudo (ex: '30 dias', 'imediato'). Ausente → omitir, nunca estimar.",
    ),
});

export const equipamentoSchema = z.object({
  identificacao: z
    .string()
    .describe(
      "Identificação do equipamento no laudo (ex: 'Elevador Social 01', 'Elevador de Serviço').",
    ),
  tipo: z
    .string()
    .optional()
    .describe(
      "Tipo do elevador se informado (ex: 'elétrico de tração', 'hidráulico'). Ausente → omitir.",
    ),
  naoConformidades: z
    .array(naoConformidadeSchema)
    .describe(
      "Não-conformidades apontadas para este equipamento. Lista vazia se nenhuma.",
    ),
});

export const predioSchema = z.object({
  nome: z
    .string()
    .describe(
      "Nome ou identificação do prédio/condomínio inspecionado, como consta no laudo.",
    ),
  endereco: z
    .string()
    .optional()
    .describe(
      "Endereço completo do prédio INCLUINDO cidade e UF/estado (ex: 'Av. Fernando Ferrari, 1900, Aeroporto, Vitória - ES'). Costuma estar no cabeçalho. É usado para identificar a lei municipal do RIA, então capture cidade e UF sempre que aparecerem. Ausente → omitir.",
    ),
});

export const produtorSchema = z.object({
  nome: z
    .string()
    .describe(
      "Nome do responsável técnico que assina o laudo (engenheiro/conservadora). NUNCA omitir do produto — é exigência de liability.",
    ),
  crea: z
    .string()
    .optional()
    .describe(
      "Registro CREA do responsável técnico, se constar no laudo. Ausente → omitir.",
    ),
});

export const laudoSchema = z.object({
  predio: predioSchema,
  produtor: produtorSchema,
  equipamentos: z
    .array(equipamentoSchema)
    .describe(
      "Equipamentos (elevadores) cobertos pelo laudo, cada um com suas não-conformidades.",
    ),
  dataInspecao: z
    .string()
    .optional()
    .describe(
      "Data da inspeção como consta no laudo (formato original, ex: 'DD/MM/AAAA'). Ausente → omitir.",
    ),
  statusGeral: z
    .enum(["seguro", "atencao", "urgente"])
    .describe(
      "Leitura agregada da condição no laudo: 'urgente' se há NC urgente, 'atencao' se há NCs a corrigir sem urgência, 'seguro' se nenhuma pendência relevante. É leitura do laudo, NÃO atestado de segurança.",
    ),
});

export type NaoConformidade = z.infer<typeof naoConformidadeSchema>;
export type Equipamento = z.infer<typeof equipamentoSchema>;
export type LaudoExtraido = z.infer<typeof laudoSchema>;
