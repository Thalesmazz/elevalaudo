import type { NcPonto } from "@/components/dashboard/nc-charts";
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

/**
 * Evolução das inspeções publicadas do prédio (de urgente a seguro) — alimenta
 * o gráfico "cheio" (barra/linha, via `NcCharts`) da cena de dashboard, no
 * mesmo estilo do modal de gráficos sob demanda. Eixo X = data da inspeção.
 */
export const DEMO_NC_EVOLUCAO: NcPonto[] = [
  { rotulo: "10/09/2019", urgente: 3, atencao: 2, leve: 1, total: 6 },
  { rotulo: "12/09/2020", urgente: 4, atencao: 1, leve: 0, total: 5 },
  { rotulo: "25/08/2021", urgente: 1, atencao: 3, leve: 1, total: 5 },
  { rotulo: "01/09/2022", urgente: 0, atencao: 2, leve: 1, total: 3 },
  { rotulo: "18/09/2023", urgente: 0, atencao: 0, leve: 1, total: 1 },
  { rotulo: "07/09/2024", urgente: 0, atencao: 1, leve: 0, total: 1 },
  { rotulo: "15/09/2025", urgente: 0, atencao: 0, leve: 0, total: 0 },
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

/**
 * Cena "chat": encenação do "Pergunte ao laudo" (a feature real de
 * `dashboard/laudo-chat.tsx`) sobre o laudo urgente do dashboard. As
 * respostas são mockadas — a landing é pública e não gasta LLM — mas saem
 * só do que está nas `DEMO_NCS` acima, com o mesmo tom liability-safe do
 * produto (ADR-002: comunica o laudo, não certifica segurança). Cada
 * resposta é estruturada em parágrafos de segmentos (negrito via `forte`)
 * pra streamear palavra a palavra sem parsear Markdown no meio do caminho.
 */
export type DemoChatSegmento = { texto: string; forte?: boolean };

export type DemoChatQa = {
  pergunta: string;
  /** Parágrafos → segmentos. */
  resposta: DemoChatSegmento[][];
};

export const DEMO_CHAT_QAS: DemoChatQa[] = [
  {
    pergunta: "Posso usar o elevador normalmente?",
    resposta: [
      [
        { texto: "Não por enquanto.", forte: true },
        {
          texto:
            " O laudo aponta 4 problemas urgentes com recomendação de interdição imediata — entre eles dois degraus com trinca visível e o pente de entrada com dentes dobrados.",
        },
      ],
      [
        {
          texto:
            "Libere o uso só depois que o responsável técnico confirmar as correções.",
        },
      ],
    ],
  },
  {
    pergunta: "Qual é o problema mais urgente?",
    resposta: [
      [
        {
          texto: "Os dois degraus com trinca lateral visível.",
          forte: true,
        },
        {
          texto:
            " O laudo recomenda interdição imediata e a substituição dos degraus (NBR 16858, item 4.3).",
        },
      ],
      [
        {
          texto:
            "Há ainda outros 3 itens urgentes, como o cabo auxiliar com fios rompidos.",
        },
      ],
    ],
  },
  {
    pergunta: "Quais os prazos para corrigir?",
    resposta: [
      [
        { texto: "Todos os 5 itens têm prazo imediato.", forte: true },
        {
          texto:
            " Os 4 urgentes (degraus, pente, cabo auxiliar e trava da porta do poço) pedem correção antes de liberar o uso.",
        },
      ],
      [
        {
          texto:
            "O item de atenção — limpeza do poço — também foi apontado para ação imediata.",
        },
      ],
    ],
  },
];

export type DemoCena =
  | "upload"
  | "extracao"
  | "dashboard"
  | "chat"
  | "lista";

export const DEMO_CENAS: {
  id: DemoCena;
  titulo: string;
  url: string;
  duracaoMs: number;
}[] = [
  { id: "upload", titulo: "Upload", url: "elevalaudo.app/upload", duracaoMs: 5500 },
  {
    id: "extracao",
    titulo: "Extração",
    url: `elevalaudo.app/laudos/shopping-plaza-bela-vista`,
    duracaoMs: 6800,
  },
  {
    id: "dashboard",
    titulo: "Dashboard",
    url: `elevalaudo.app/laudos/shopping-plaza-bela-vista`,
    duracaoMs: 9000,
  },
  {
    id: "chat",
    titulo: "Pergunte ao laudo",
    url: `elevalaudo.app/laudos/shopping-plaza-bela-vista`,
    // conversa de 2 turnos (clique + resposta, depois pergunta "digitada" +
    // resposta) precisa de mais tempo que uma única troca.
    duracaoMs: 12500,
  },
  {
    id: "lista",
    titulo: "Meus laudos",
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
