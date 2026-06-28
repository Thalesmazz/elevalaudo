import type { Equipamento, NaoConformidade } from "@/lib/schema/laudo";
import type { StatusGeral } from "@/lib/status";

/**
 * Timeline multi-laudo por prédio/equipamento (P5 `equipamento-timeline`,
 * ADR-007) — helpers PUROS (slug, parse de data, montagem de ponto, diff).
 *
 * Sem `import "server-only"` nem acesso a DB de propósito: o seed
 * (`drizzle/seed-timeline.ts`) reusa `slugifyPredio` daqui. As queries de banco
 * ficam em `timeline-db.ts` (essas sim com o guard server-only).
 *
 * Regras inegociáveis (ADR-002 / ADR-007):
 * - Só laudo `publicado` (revisado + assinado) entra na timeline. Filtrado na
 *   query (`timeline-db.ts`).
 * - O agrupamento usa a coluna `predio_key` congelada no publish — não recalcula
 *   nome cru de OCR a cada query.
 */

/**
 * Slug normalizado: minúsculas, sem acento, só alfanumérico, hifens colapsados.
 * Fonte do `predio_key` (gravado ao publicar) e do match de equipamento dentro
 * do prédio. Determinístico — a mesma string sempre vira a mesma chave.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Chave estável do prédio para a timeline. Derivada de `predio.nome`. */
export function slugifyPredio(nome: string): string {
  return slugify(nome);
}

/** Casa o mesmo equipamento entre laudos pela identificação normalizada. */
export function slugifyEquip(identificacao: string): string {
  return slugify(identificacao);
}

/**
 * Parseia a data da inspeção (`dd/mm/aaaa`, formato do laudo BR) em Date.
 * Retorna null se ausente/ilegível — o caller cai no fallback (`publicado_em`).
 */
export function parseDataInspecao(s?: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export type Contagem = {
  urgente: number;
  atencao: number;
  leve: number;
  total: number;
};

function contar(ncs: NaoConformidade[]): Contagem {
  const c: Contagem = { urgente: 0, atencao: 0, leve: 0, total: ncs.length };
  for (const nc of ncs) c[nc.severidade] += 1;
  return c;
}

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export type EquipamentoPonto = {
  slug: string;
  nome: string;
  contagem: Contagem;
  naoConformidades: NaoConformidade[];
};

export type TimelinePonto = {
  laudoId: string;
  shareToken: string | null;
  /** Data de referência (inspeção, ou publicação como fallback). */
  dataMs: number;
  /** Rótulo cheio para o eixo/lista (ex: "14/05/2024" ou "mai/2024"). */
  dataLabel: string;
  /** Rótulo curto para o eixo do gráfico (ex: "mai/24"). */
  dataCurta: string;
  /** True quando a data veio de `dataInspecao`; false = fallback publicação. */
  dataEstimada: boolean;
  statusGeral: StatusGeral;
  contagem: Contagem;
  porEquipamento: EquipamentoPonto[];
};

export type TimelinePredio = {
  predioKey: string;
  predioNome: string;
  /** União dos equipamentos vistos em qualquer laudo do prédio. */
  equipamentos: { slug: string; nome: string }[];
  /** Pontos ordenados por data ascendente (mais antigo → mais novo). */
  pontos: TimelinePonto[];
};

export function pontoDeLaudo(laudo: {
  id: string;
  shareToken: string | null;
  extracao: NonNullable<unknown>;
  publicadoEm: Date | null;
  createdAt: Date;
}): TimelinePonto | null {
  const extracao = laudo.extracao as {
    predio: { nome: string };
    statusGeral: StatusGeral;
    dataInspecao?: string;
    equipamentos: Equipamento[];
  } | null;
  if (!extracao) return null;

  const inspecao = parseDataInspecao(extracao.dataInspecao);
  const fallback = laudo.publicadoEm ?? laudo.createdAt;
  const ref = inspecao ?? fallback;
  const dataEstimada = inspecao === null;

  const todasNcs = extracao.equipamentos.flatMap((e) => e.naoConformidades);

  const porEquipamento: EquipamentoPonto[] = extracao.equipamentos.map((e) => ({
    slug: slugifyEquip(e.identificacao),
    nome: e.identificacao,
    contagem: contar(e.naoConformidades),
    naoConformidades: e.naoConformidades,
  }));

  const mes = MESES[ref.getMonth()];
  const ano = ref.getFullYear();

  return {
    laudoId: laudo.id,
    shareToken: laudo.shareToken,
    dataMs: ref.getTime(),
    dataLabel: extracao.dataInspecao?.trim() || `${mes}/${ano}`,
    dataCurta: `${mes}/${String(ano).slice(2)}`,
    dataEstimada,
    statusGeral: extracao.statusGeral,
    contagem: contar(todasNcs),
    porEquipamento,
  };
}

export type MudancaNc = {
  tipo: "nova" | "resolvida" | "agravada" | "amenizada";
  descricao: string;
  plainPt?: string;
  severidade: NaoConformidade["severidade"];
  severidadeAnterior?: NaoConformidade["severidade"];
  equipamento: string;
};

const SEV_PESO: Record<NaoConformidade["severidade"], number> = {
  leve: 0,
  atencao: 1,
  urgente: 2,
};

/**
 * Diff ano-a-ano entre dois pontos (P5 `comparacao-ano-a-ano`): o que surgiu,
 * foi resolvido ou mudou de severidade do laudo `anterior` para o `atual`.
 *
 * Match das NCs por (equipamento + descrição normalizada). É heurístico — o
 * laudo não tem id estável de NC — então erra se o RT reescrever a descrição.
 * Honesto sobre a limitação: serve de leitura, não de auditoria.
 */
export function compararPontos(
  anterior: TimelinePonto,
  atual: TimelinePonto,
): MudancaNc[] {
  type Idx = { nc: NaoConformidade; equip: string };
  const chave = (equipSlug: string, nc: NaoConformidade) =>
    `${equipSlug}::${slugify(nc.descricao)}`;

  const mapaAnterior = new Map<string, Idx>();
  for (const e of anterior.porEquipamento) {
    for (const nc of e.naoConformidades) {
      mapaAnterior.set(chave(e.slug, nc), { nc, equip: e.nome });
    }
  }

  const mudancas: MudancaNc[] = [];
  const vistos = new Set<string>();

  for (const e of atual.porEquipamento) {
    for (const nc of e.naoConformidades) {
      const k = chave(e.slug, nc);
      vistos.add(k);
      const antes = mapaAnterior.get(k);
      if (!antes) {
        mudancas.push({
          tipo: "nova",
          descricao: nc.descricao,
          plainPt: nc.plainPt,
          severidade: nc.severidade,
          equipamento: e.nome,
        });
      } else if (SEV_PESO[nc.severidade] > SEV_PESO[antes.nc.severidade]) {
        mudancas.push({
          tipo: "agravada",
          descricao: nc.descricao,
          plainPt: nc.plainPt,
          severidade: nc.severidade,
          severidadeAnterior: antes.nc.severidade,
          equipamento: e.nome,
        });
      } else if (SEV_PESO[nc.severidade] < SEV_PESO[antes.nc.severidade]) {
        mudancas.push({
          tipo: "amenizada",
          descricao: nc.descricao,
          plainPt: nc.plainPt,
          severidade: nc.severidade,
          severidadeAnterior: antes.nc.severidade,
          equipamento: e.nome,
        });
      }
    }
  }

  // Presentes antes e ausentes agora = resolvidas.
  for (const [k, antes] of mapaAnterior) {
    if (!vistos.has(k)) {
      mudancas.push({
        tipo: "resolvida",
        descricao: antes.nc.descricao,
        plainPt: antes.nc.plainPt,
        severidade: antes.nc.severidade,
        equipamento: antes.equip,
      });
    }
  }

  // Ordena: resolvida (vitória) primeiro? Não — prioriza o que exige ação.
  const ORDEM: Record<MudancaNc["tipo"], number> = {
    nova: 0,
    agravada: 1,
    resolvida: 2,
    amenizada: 3,
  };
  return mudancas.sort((a, b) => ORDEM[a.tipo] - ORDEM[b.tipo]);
}
