/**
 * Gerador dos PDFs de teste da timeline (P5 `equipamento-timeline`).
 *
 * Cria 3 laudos fictícios do MESMO prédio ("Condomínio Edifício Vista Verde")
 * em datas diferentes (2024 → 2025 → 2026) com as não-conformidades EVOLUINDO,
 * no mesmo formato do laudo de entrada (RIA / ABNT NBR 16858) que a extração
 * (haiku) já entende. São PDFs de TEXTO (não escaneados) → extração barata e
 * confiável no free-tier.
 *
 * Reproduzível:  node samples/generate-laudos-vista-verde.mjs
 *
 * Não toca no banco — só escreve os PDFs em samples/. O fluxo real (upload →
 * extração → revisão/assinatura → timeline) é quem popula o banco.
 */
import { createElement as h } from "react";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = dirname(fileURLToPath(import.meta.url));

const PREDIO = "Condomínio Edifício Vista Verde";
const LOCAL = "Av. Paulista, 2200 — Bela Vista, São Paulo/SP";
const CONSERVADORA = "Ascensus Elevadores Ltda. — CNPJ 12.345.678/0001-90";
const CREA_EMPRESA = "CREA-SP 9876543";
const RT = "Eng. Mec. Ricardo Almeida Souza";
const CREA_RT = "CREA-SP 5061789012";

// Equipamentos (fixos nos 3 laudos — mesma identificação = mesmo equipamento na
// timeline).
const EQ1 = {
  titulo: "EQUIPAMENTO 1 — Elevador Social 01",
  ident: "Elevador Social 01",
  modelo: "Atlas Schindler 3300",
  tipo: "Elétrico de tração",
  fab: "Schindler",
  num: "SCH-2014-77123",
  cap: "8 pessoas / 600 kg",
  vel: "1,0 m/s",
  paradas: "12",
};
const EQ2 = {
  titulo: "EQUIPAMENTO 2 — Elevador de Serviço 02",
  ident: "Elevador de Serviço 02",
  modelo: "Otis Gen2 Hydro",
  tipo: "Hidráulico",
  fab: "Otis",
  num: "OT-2016-44980",
  cap: "13 pessoas / 1000 kg",
  vel: "0,63 m/s",
  paradas: "12",
};

// Itens APROVADOS comuns (dão corpo ao checklist; não viram NC).
const APROVADOS_EQ1 = [
  ["1.1", "Contrato de manutenção"],
  ["1.2", "Registro da empresa no CREA"],
  ["1.3", "Registro do responsável técnico"],
  ["2.6", "Estado da máquina de tração"],
  ["2.13", "Verificação do aterramento"],
  ["5.4", "Funcionamento da porta de pavimento e da cabina"],
];
const APROVADOS_EQ2 = [
  ["1.1", "Contrato de manutenção"],
  ["1.4", "Relatório de inspeção anual anterior"],
  ["2.5", "Disjuntor e alimentação principal"],
  ["7.8", "Teste de carga"],
];

/**
 * Os 3 laudos. Cada "reprovados" é uma não-conformidade que a extração vai pegar.
 * A evolução é o ponto: itens aparecem, mudam de gravidade e somem (resolvidos).
 */
const LAUDOS = [
  {
    arquivo: "laudo-vista-verde-2024.pdf",
    relatorio: "RIA-2024-0312",
    data: "12/03/2024",
    reprovadosEq1: [
      [
        "2.8",
        "Estado de funcionamento do freio",
        "Folga do freio levemente acima do especificado pelo fabricante. Ajuste/regulagem recomendado. Prazo: 30 dias.",
      ],
      [
        "3.6",
        "Iluminação de emergência, alarme e comunicação",
        "Luminária de iluminação de emergência da cabine inoperante. Substituir. Prazo: 30 dias.",
      ],
    ],
    reprovadosEq2: [
      [
        "5.9",
        "Dispositivo de proteção de esmagamento de porta (barreira de luz)",
        "Barreira de luz com falha intermitente na detecção. Substituir sensor. Prazo: 45 dias.",
      ],
    ],
    conclusao:
      "Não foram identificadas não-conformidades com risco iminente. As pendências (freio, iluminação de emergência e barreira de luz) devem ser corrigidas nos prazos indicados. Parecer geral: Reprovado com pendências — correções obrigatórias nos prazos.",
  },
  {
    arquivo: "laudo-vista-verde-2025.pdf",
    relatorio: "RIA-2025-0418",
    data: "18/04/2025",
    reprovadosEq1: [
      [
        "2.18",
        "Cabos de tração",
        "Desgaste superior a 10% do diâmetro em 3 dos 4 cabos de tração; fios rompidos visíveis. Risco de rompimento. Substituição IMEDIATA dos cabos (NBR 16858 item 5.5.2).",
      ],
      [
        "2.8",
        "Estado de funcionamento do freio",
        "Folga do freio persiste, agora com ruído na frenagem. Ajuste/regulagem. Prazo: 15 dias.",
      ],
    ],
    reprovadosEq2: [
      [
        "5.9",
        "Dispositivo de proteção de esmagamento de porta (barreira de luz)",
        "Barreira de luz ainda com falha intermitente. Substituir sensor. Prazo: 30 dias.",
      ],
      [
        "6.2",
        "Estado de conservação e limpeza do poço",
        "Acúmulo de detritos e pequeno vazamento de óleo no fundo do poço. Limpeza e vedação da conexão hidráulica. Prazo: 60 dias.",
      ],
    ],
    conclusao:
      "O Elevador Social 01 apresenta não-conformidade URGENTE nos cabos de tração (item 2.18), com risco de rompimento — recomenda-se interdição preventiva e substituição imediata. As demais pendências (freio, barreira de luz e poço) devem ser corrigidas nos prazos. Parecer geral: Reprovado com pendência urgente.",
  },
  {
    arquivo: "laudo-vista-verde-2026.pdf",
    relatorio: "RIA-2026-0520",
    data: "20/05/2026",
    reprovadosEq1: [
      [
        "5.12",
        "Acabamento e revestimento interno da cabina",
        "Revestimento do piso e parede da cabine com desgaste estético. Manutenção preventiva recomendada. Prazo: 90 dias.",
      ],
    ],
    reprovadosEq2: [
      [
        "6.2",
        "Estado de conservação e limpeza do poço",
        "Leve acúmulo de detritos remanescente no poço; vazamento de óleo já sanado. Limpeza periódica. Prazo: 90 dias.",
      ],
    ],
    conclusao:
      "Os cabos de tração (item 2.18) foram substituídos, o freio foi regulado e a barreira de luz foi substituída — itens urgentes/críticos do laudo anterior estão sanados. Permanecem apenas pendências leves (acabamento da cabine e limpeza do poço). Parecer geral: Reprovado com pendências leves — sem risco iminente.",
  },
];

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, lineHeight: 1.4, fontFamily: "Helvetica" },
  h1: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sub: { fontSize: 8, color: "#444", marginBottom: 10 },
  meta: { marginBottom: 1 },
  eqTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 4,
  },
  secTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 4,
  },
  rowHead: {
    flexDirection: "row",
    borderBottom: "1pt solid #000",
    paddingBottom: 2,
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #ccc",
    paddingVertical: 2,
  },
  cNum: { width: "8%" },
  cItem: { width: "42%" },
  cMark: { width: "8%", textAlign: "center" },
  cObs: { width: "34%" },
  obsText: { color: "#222" },
});

function checklistRows(aprovados, reprovados) {
  const rows = [
    h(
      View,
      { style: s.rowHead, key: "head" },
      h(Text, { style: s.cNum }, "Nº"),
      h(Text, { style: s.cItem }, "Item de inspeção"),
      h(Text, { style: s.cMark }, "Apr."),
      h(Text, { style: s.cMark }, "Rep."),
      h(Text, { style: s.cMark }, "N/A"),
      h(Text, { style: s.cObs }, "Observações"),
    ),
  ];
  for (const [num, item] of aprovados) {
    rows.push(
      h(
        View,
        { style: s.row, key: `a-${num}-${item}` },
        h(Text, { style: s.cNum }, num),
        h(Text, { style: s.cItem }, item),
        h(Text, { style: s.cMark }, "X"),
        h(Text, { style: s.cMark }, ""),
        h(Text, { style: s.cMark }, ""),
        h(Text, { style: s.cObs }, ""),
      ),
    );
  }
  for (const [num, item, obs] of reprovados) {
    rows.push(
      h(
        View,
        { style: s.row, key: `r-${num}-${item}` },
        h(Text, { style: s.cNum }, num),
        h(Text, { style: s.cItem }, item),
        h(Text, { style: s.cMark }, ""),
        h(Text, { style: s.cMark }, "X"),
        h(Text, { style: s.cMark }, ""),
        h(Text, { style: [s.cObs, s.obsText] }, obs),
      ),
    );
  }
  return rows;
}

function equipBlock(eq, reprovados, aprovados) {
  return h(
    View,
    { key: eq.ident },
    h(Text, { style: s.eqTitle }, eq.titulo),
    h(Text, { style: s.meta }, `Identificação do equipamento: ${eq.ident}`),
    h(Text, { style: s.meta }, `Modelo do equipamento: ${eq.modelo}`),
    h(Text, { style: s.meta }, `Tipo: ${eq.tipo}`),
    h(Text, { style: s.meta }, `Fabricante: ${eq.fab}`),
    h(Text, { style: s.meta }, `Número de fabricação: ${eq.num}`),
    h(Text, { style: s.meta }, `Capacidade nominal: ${eq.cap}`),
    h(Text, { style: s.meta }, `Velocidade nominal: ${eq.vel}`),
    h(Text, { style: s.meta }, `Número de paradas: ${eq.paradas}`),
    ...checklistRows(aprovados, reprovados),
  );
}

function doc(laudo) {
  const nEq = 2;
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: s.page },
      h(Text, { style: s.h1 }, "RELATÓRIO DE INSPEÇÃO ANUAL DE ELEVADORES"),
      h(
        Text,
        { style: s.sub },
        "Conforme ABNT NBR 16858 — Lei Municipal SP 10.348/87 (RIA)",
      ),
      h(Text, { style: s.meta }, `Relatório nº: ${laudo.relatorio}`),
      h(Text, { style: s.meta }, `Empresa contratante: ${PREDIO}`),
      h(Text, { style: s.meta }, `Local de instalação: ${LOCAL}`),
      h(Text, { style: s.meta }, `Empresa conservadora: ${CONSERVADORA}`),
      h(Text, { style: s.meta }, `Registro da empresa no CREA: ${CREA_EMPRESA}`),
      h(Text, { style: s.meta }, `Responsável técnico (inspetor): ${RT}`),
      h(Text, { style: s.meta }, `CREA do responsável técnico: ${CREA_RT}`),
      h(Text, { style: s.meta }, `Data da inspeção: ${laudo.data}`),
      h(Text, { style: s.meta }, `Quantidade de equipamentos: ${nEq} (dois)`),

      equipBlock(EQ1, laudo.reprovadosEq1, APROVADOS_EQ1),
      equipBlock(EQ2, laudo.reprovadosEq2, APROVADOS_EQ2),

      h(Text, { style: s.secTitle }, "CONCLUSÃO DA INSPEÇÃO"),
      h(Text, { style: { marginBottom: 8 } }, laudo.conclusao),
      h(Text, { style: s.meta }, `Data da inspeção: ${laudo.data}`),
      h(
        Text,
        { style: s.meta },
        `Inspetor / Responsável técnico: ${RT} — ${CREA_RT}`,
      ),
      h(Text, { style: s.meta }, `Empresa responsável: ${CONSERVADORA}`),
      h(
        Text,
        { style: { marginTop: 10, fontSize: 7, color: "#888" } },
        "Documento fictício gerado para teste do sistema ElevaLaudo. Não possui validade legal.",
      ),
    ),
  );
}

for (const laudo of LAUDOS) {
  const buf = await renderToBuffer(doc(laudo));
  const out = join(OUT_DIR, laudo.arquivo);
  writeFileSync(out, buf);
  console.log(`✓ ${laudo.arquivo}  (${(buf.length / 1024).toFixed(1)} KB)`);
}
console.log("\nPDFs gerados em samples/.");
