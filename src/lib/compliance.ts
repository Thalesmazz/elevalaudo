import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Compliance municipal (P3 `dashboard-compliance-municipal`).
 *
 * Status do RIA (Relatório de Inspeção Anual) vs a lei da cidade. O RIA é
 * emitido após a inspeção anual e, em várias cidades, deve ser enviado à
 * prefeitura todo ano (forcing function recorrente). Ver
 * `docs/20-Areas/Domain/nbr-ria-compliance.md`.
 *
 * Liability (ADR-002 / NEVER-DO): o produto COMUNICA, não certifica. Este selo
 * é **leitura/estimativa**, nunca atestado legal. Prazos e multas variam por
 * cidade e mudam — por isso todo valor sai marcado como "estimado" e citando a
 * lei. Nunca afirmar multa ou conformidade como fato.
 *
 * Escopo MVP (NEVER-DO): 1 cidade só — a do design partner. Começamos por São
 * Paulo (Lei 10.348), a única com valor de multa documentado.
 */

export type CidadeCompliance = {
  /** Chave estável da cidade. */
  id: string;
  cidade: string;
  uf: string;
  /** Lei municipal que torna o RIA obrigatório. */
  lei: string;
  /** Validade do RIA em meses (inspeção anual → 12). */
  validadeMeses: number;
  /**
   * Multa estimada por não emitir/enviar o RIA, como texto. SEMPRE exibida como
   * estimativa — valores variam por cidade e mudam (confirmar com a prefeitura).
   * OPCIONAL: só preenchemos onde o valor está documentado. Cidade sem valor
   * conhecido → não inventamos (NEVER-DO), o card manda confirmar na prefeitura.
   */
  multaEstimada?: string;
  /** Trechos (UPPERCASE) que, se aparecem no endereço do laudo, casam a cidade. */
  matchers: string[];
};

/** Validade anual do RIA quando a cidade não é reconhecida (NBR = inspeção anual). */
export const VALIDADE_PADRAO_MESES = 12;

/**
 * São Paulo tem o valor de multa documentado no domínio (~R$ 854 a R$ 930,
 * sujeito a confirmação).
 */
const SAO_PAULO: CidadeCompliance = {
  id: "sao-paulo",
  cidade: "São Paulo",
  uf: "SP",
  lei: "Lei Municipal 10.348",
  validadeMeses: 12,
  multaEstimada: "R$ 854 a R$ 930",
  matchers: ["SÃO PAULO", "SAO PAULO"],
};

/**
 * Vitória-ES — RIA pelo Art. 40 da Lei 4.821/98 (consta no cabeçalho do laudo
 * do design partner). Multa NÃO documentada → omitida de propósito; o card
 * pede confirmação na prefeitura em vez de chutar valor.
 */
const VITORIA_ES: CidadeCompliance = {
  id: "vitoria-es",
  cidade: "Vitória",
  uf: "ES",
  lei: "Lei Municipal 4.821/98 (Art. 40)",
  validadeMeses: 12,
  matchers: ["VITÓRIA", "VITORIA"],
};

/** Cidades suportadas. Cresce conforme entram novos design partners. */
export const CIDADES: CidadeCompliance[] = [SAO_PAULO, VITORIA_ES];

/** Mantido por compatibilidade; é só o primeiro da lista. */
export const CIDADE_PADRAO = SAO_PAULO;

/**
 * Resolve a cidade do laudo a partir do endereço do prédio. Casa por nome da
 * cidade ou pelo token da UF (" ES", "- ES", "/ES"). Não reconheceu → undefined
 * (o card cai no modo honesto, sem afirmar lei de outra cidade — liability).
 */
export function resolverCidade(
  endereco?: string,
): CidadeCompliance | undefined {
  if (!endereco) return undefined;
  const up = endereco.toUpperCase();
  return CIDADES.find(
    (c) =>
      c.matchers.some((m) => up.includes(m)) ||
      [` ${c.uf}`, `-${c.uf}`, `/${c.uf}`, `- ${c.uf}`].some((t) =>
        up.includes(t),
      ),
  );
}

export type RiaStatus = "emDia" | "vencendo" | "vencido" | "semData";

/** Janela (em dias) antes do vencimento em que o RIA entra em "vence em breve". */
const JANELA_VENCENDO_DIAS = 60;

const MS_DIA = 86_400_000;

type RiaStatusEntry = {
  label: string;
  Icon: LucideIcon;
  /** Cor do texto/ícone do status ativo. Reusa o vocabulário RAG do hero. */
  accent: string;
  /** Pill da badge (anel + fundo translúcido). */
  pill: string;
  /** Barra lateral do card (ranking visual, igual à nc-list). */
  borderAccent: string;
};

/**
 * Vocabulário visual do status do RIA. Mesma família de cor do semáforo
 * (`statusConfig`/`severidadeConfig`), mas vocabulário próprio de prazo
 * (em dia / vence em breve / vencido) — é compliance, não condição do elevador.
 */
export const riaStatusConfig: Record<RiaStatus, RiaStatusEntry> = {
  emDia: {
    label: "Em dia",
    Icon: CalendarCheck,
    accent: "text-emerald-600 dark:text-emerald-400",
    pill: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
    borderAccent: "border-l-emerald-500",
  },
  vencendo: {
    label: "Vence em breve",
    Icon: CalendarClock,
    accent: "text-amber-600 dark:text-amber-400",
    pill: "bg-amber-400/10 text-amber-700 ring-amber-500/25 dark:text-amber-400",
    borderAccent: "border-l-amber-400",
  },
  vencido: {
    label: "Vencido",
    Icon: CalendarX,
    accent: "text-red-600 dark:text-red-400",
    pill: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-400",
    borderAccent: "border-l-red-500",
  },
  semData: {
    label: "Sem data de inspeção",
    Icon: HelpCircle,
    accent: "text-muted-foreground",
    pill: "bg-muted text-muted-foreground ring-border",
    borderAccent: "border-l-zinc-300 dark:border-l-zinc-600",
  },
};

export type ComplianceEstimativa = {
  /** Cidade reconhecida do laudo, ou `undefined` (município não identificado). */
  cidade?: CidadeCompliance;
  status: RiaStatus;
  /** Data de vencimento estimada (inspeção + validade), pt-BR, se houver data. */
  vencimentoLabel?: string;
  /** Dias até o vencimento (negativo = vencido). Ausente se sem data. */
  diasRestantes?: number;
  /** Frase de leitura do prazo, liability-safe. */
  resumo: string;
};

/** Parse tolerante de "DD/MM/AAAA" (formato original do laudo). */
function parseDataBr(data: string): Date | null {
  const m = data.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(d.getTime()) ? null : d;
}

function addMeses(base: Date, meses: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + meses);
  return d;
}

/**
 * Estima o status de compliance do RIA a partir da data de inspeção do laudo.
 *
 * `hoje` é injetável para testes determinísticos (sandbox). Tudo aqui é
 * ESTIMATIVA — o vencimento é derivado da inspeção + validade anual, não um
 * dado oficial da prefeitura.
 */
export function estimarCompliance(
  dataInspecao: string | undefined,
  cidade?: CidadeCompliance,
  hoje: Date = new Date(),
): ComplianceEstimativa {
  const inspecao = dataInspecao ? parseDataBr(dataInspecao) : null;

  // Referência da regra: cita a lei se reconhecemos a cidade; senão, fala
  // genérico (NUNCA afirma a lei de outra cidade) e pede confirmação.
  const ref = cidade ? `Pela ${cidade.lei}, ` : "Pela inspeção anual, ";
  const notaMunicipio = cidade
    ? ""
    : " A obrigação e o prazo do RIA variam por município — confirme com a prefeitura.";

  if (!inspecao) {
    return {
      cidade,
      status: "semData",
      resumo:
        "O laudo não traz a data de inspeção, então não dá para estimar o prazo do RIA. Confirme com o responsável técnico." +
        notaMunicipio,
    };
  }

  const validadeMeses = cidade?.validadeMeses ?? VALIDADE_PADRAO_MESES;
  const vencimento = addMeses(inspecao, validadeMeses);
  const diasRestantes = Math.floor(
    (vencimento.getTime() - hoje.getTime()) / MS_DIA,
  );
  const vencimentoLabel = vencimento.toLocaleDateString("pt-BR");

  let status: RiaStatus;
  let resumo: string;

  if (diasRestantes < 0) {
    status = "vencido";
    const atraso = Math.abs(diasRestantes);
    resumo = `${ref}estima-se que o RIA venceu há ${atraso} dia${atraso === 1 ? "" : "s"} (${vencimentoLabel}). Recomenda-se nova inspeção e envio à prefeitura.${notaMunicipio}`;
  } else if (diasRestantes <= JANELA_VENCENDO_DIAS) {
    status = "vencendo";
    resumo = `${ref}estima-se que o RIA vence em ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} (${vencimentoLabel}). Vale agendar a renovação.${notaMunicipio}`;
  } else {
    status = "emDia";
    resumo = `${ref}estima-se que o RIA segue válido até ${vencimentoLabel}.${notaMunicipio}`;
  }

  return { cidade, status, vencimentoLabel, diasRestantes, resumo };
}
