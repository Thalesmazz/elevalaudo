import type { NcPonto } from "@/components/dashboard/nc-charts";
import type { TimelinePontoChart } from "@/components/dashboard/timeline-chart";
import type { StatusGeral } from "@/lib/status";

/**
 * Dados da demo interativa da landing (ver ADR-009). Os NÚMEROS do gráfico e
 * os textos das não-conformidades vêm de um laudo publicado de verdade na
 * conta de desenvolvimento do produto (6 inspeções ao longo de 2021-2025,
 * contando a evolução de verdade de "urgente" até "seguro") — não são
 * inventados. Já o nome do prédio e o nome/CREA do engenheiro são fictícios
 * de propósito: é uma página pública sem login, e o CREA é um dado
 * profissional real que não publicamos por tempo indeterminado só pra
 * enriquecer uma demo. A cena `lista` também mistura prédios fictícios
 * adicionais, pelo mesmo motivo.
 */

export const DEMO_PREDIO = "Shopping Plaza Bela Vista";
export const DEMO_ARQUIVO = "laudo-shopping-plaza.pdf";
export const DEMO_ENGENHEIRO = "Eng. Mec. Fernanda Ribeiro · CREA-SP 456789/D";

/** Status + números da inspeção de 2021 (a mais rica) — vira o "laudo recém-extraído" da demo. */
export const DEMO_STATUS: StatusGeral = "urgente";

export const DEMO_KPIS = {
  equipamentos: 3,
  naoConformidades: 5,
  urgentes: 4,
} as const;

export type DemoNc = {
  severidade: "urgente" | "atencao" | "leve";
  texto: string;
  /** Só as NCs do dashboard (dados reais) têm ação/prazo pra expandir. */
  acao?: string;
  prazo?: string;
  itemNbr?: string;
};

export const DEMO_NCS: DemoNc[] = [
  {
    severidade: "urgente",
    texto: "Dois degraus com trinca lateral visível — interdição imediata",
    acao: "Substituir os degraus trincados",
    prazo: "Imediato",
    itemNbr: "4.3",
  },
  {
    severidade: "urgente",
    texto: "Pente com dentes dobrados — risco de aprisionamento de calçado",
    acao: "Reparar ou substituir o pente de entrada/saída",
    prazo: "Imediato",
    itemNbr: "3.4",
  },
  {
    severidade: "urgente",
    texto: "Cabo auxiliar com fios rompidos visíveis (> 5% da seção)",
    acao: "Substituir o cabo de tração auxiliar",
    prazo: "Imediato",
    itemNbr: "2.18",
  },
  {
    severidade: "urgente",
    texto: "Porta do poço sem trava de segurança",
    acao: "Instalar trava de segurança homologada na porta do poço",
    prazo: "Imediato",
    itemNbr: "8.1",
  },
  {
    severidade: "atencao",
    texto: "Poço com lixo e óleo acumulado",
    acao: "Efetuar limpeza completa do poço e descarte correto dos resíduos",
    prazo: "Imediato",
    itemNbr: "6.2",
  },
];

/** Quebra por equipamento (inspeção de 2021) — alimenta o `NcCharts` real na cena de dashboard. */
export const DEMO_NC_POR_EQUIPAMENTO: NcPonto[] = [
  { rotulo: "Escada rolante", urgente: 2, atencao: 0, leve: 0, total: 2 },
  { rotulo: "Panorâmico", urgente: 1, atencao: 0, leve: 0, total: 1 },
  { rotulo: "Carga", urgente: 1, atencao: 1, leve: 0, total: 2 },
];

/** Evolução real das 5 inspeções publicadas do prédio — de urgente a seguro. */
export const DEMO_TIMELINE: TimelinePontoChart[] = [
  { dataCurta: "2021", dataLabel: "Inspeção 2021", urgente: 4, atencao: 1, leve: 0, total: 5, dataEstimada: false },
  { dataCurta: "2022", dataLabel: "Inspeção 2022", urgente: 0, atencao: 3, leve: 0, total: 3, dataEstimada: false },
  { dataCurta: "2023", dataLabel: "Inspeção 2023", urgente: 0, atencao: 0, leve: 1, total: 1, dataEstimada: false },
  { dataCurta: "2024", dataLabel: "Inspeção 2024", urgente: 0, atencao: 1, leve: 0, total: 1, dataEstimada: false },
  { dataCurta: "2025", dataLabel: "Inspeção 2025", urgente: 0, atencao: 0, leve: 0, total: 0, dataEstimada: false },
];

export type DemoHistoricoCard = {
  fluxo: "publicado";
  status: "seguro" | "atencao" | "urgente";
  titulo: string;
  linha: string;
};

export const DEMO_HISTORICO: DemoHistoricoCard[] = [
  { fluxo: "publicado", status: "urgente", titulo: DEMO_PREDIO, linha: "Inspeção 2021 · 5 não-conformidades · publicado" },
  { fluxo: "publicado", status: "atencao", titulo: DEMO_PREDIO, linha: "Inspeção 2022 · 3 não-conformidades · publicado" },
  { fluxo: "publicado", status: "atencao", titulo: DEMO_PREDIO, linha: "Inspeção 2023 · 1 não-conformidade · publicado" },
  { fluxo: "publicado", status: "atencao", titulo: DEMO_PREDIO, linha: "Inspeção 2024 · 1 não-conformidade · publicado" },
  { fluxo: "publicado", status: "seguro", titulo: DEMO_PREDIO, linha: "Inspeção 2025 · 0 não-conformidades · publicado" },
];

/**
 * Cena "lista": simula a tela `/laudos` de uma operação madura. O primeiro
 * item é o prédio do dashboard/histórico (números reais, nome fictício); os
 * demais são fictícios, só pra mostrar volume — nunca expomos a lista
 * completa de clientes da conta numa página pública sem login.
 */
export type DemoFluxo = "publicado" | "revisar" | "extraindo" | "rascunho";

export type DemoLaudoResumo = {
  titulo: string;
  fluxo: DemoFluxo;
  status?: "seguro" | "atencao" | "urgente";
  linha: string;
};

export const DEMO_LISTA_KPIS = {
  laudos: 7,
  publicados: 4,
  emAndamento: 3,
  predios: 7,
} as const;

export const DEMO_LISTA_LAUDOS: DemoLaudoResumo[] = [
  {
    titulo: DEMO_PREDIO,
    fluxo: "publicado",
    status: "seguro",
    linha: "Inspeção 2025 · 0 não-conformidades · publicado",
  },
  {
    titulo: "Residencial Jardins do Ipê",
    fluxo: "publicado",
    status: "seguro",
    linha: "Inspeção 18/06 · 0 não-conformidades · enviado 15/06",
  },
  {
    titulo: "Condomínio Vista Verde",
    fluxo: "publicado",
    status: "urgente",
    linha: "Inspeção 30/05 · 14 não-conformidades · enviado 27/05",
  },
  {
    titulo: "Torres Alphaville Business",
    fluxo: "publicado",
    status: "atencao",
    linha: "Inspeção 22/05 · 6 não-conformidades · enviado 20/05",
  },
  {
    titulo: "Edifício Copacabana Office",
    fluxo: "revisar",
    status: "atencao",
    linha: "Inspeção 10/05 · 8 não-conformidades · enviado 09/05",
  },
  {
    titulo: "Residencial Bosque dos Eucaliptos",
    fluxo: "extraindo",
    linha: "laudo-bosque-eucaliptos.pdf · enviado agora",
  },
  {
    titulo: "Edifício Porto Seguro",
    fluxo: "rascunho",
    linha: "Rascunho salvo · sem PDF anexado",
  },
];

export type DemoCena =
  | "upload"
  | "extracao"
  | "dashboard"
  | "historico"
  | "lista";

export const DEMO_CENAS: { id: DemoCena; url: string; duracaoMs: number }[] = [
  { id: "upload", url: "elevalaudo.app/upload", duracaoMs: 5500 },
  {
    id: "extracao",
    url: `elevalaudo.app/laudos/shopping-plaza-bela-vista`,
    duracaoMs: 6800,
  },
  {
    id: "dashboard",
    url: `elevalaudo.app/laudos/shopping-plaza-bela-vista`,
    duracaoMs: 9000,
  },
  {
    id: "historico",
    url: "elevalaudo.app/predios/shopping-plaza-bela-vista",
    duracaoMs: 7200,
  },
  {
    id: "lista",
    url: "elevalaudo.app/laudos",
    duracaoMs: 8200,
  },
];

export const EXTRACAO_STEPS = [
  "Lendo o PDF",
  "Separando equipamentos",
  "Classificando severidades",
  "Montando o dashboard",
] as const;
