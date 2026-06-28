/**
 * Seed da timeline multi-laudo (P5 `equipamento-timeline`, ADR-007).
 *
 * Os laudos fictícios atuais são todos o mesmo prédio na MESMA data — uma
 * timeline com eles fica "parada". Este seed cria 3 laudos do MESMO prédio/
 * equipamento em datas diferentes (2024 → 2025 → 2026) com as não-conformidades
 * EVOLUINDO (aparecendo, sendo resolvidas, mudando de severidade), pra ter o
 * "filme" da evolução.
 *
 * Reusa o `LaudoSchema` (valida cada extração antes de inserir — mesma fonte da
 * verdade da extração real) e a derivação de `predio_key` do publish.
 *
 * Reproduzível e idempotente: apaga os laudos do prédio-seed antes de reinserir
 * (identificado pela `predio_key` derivada do nome). Não toca em outros laudos.
 *
 *   nvm use 24 && pnpm db:seed
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { laudoSchema, type LaudoExtraido } from "@/lib/schema/laudo";
import { generateShareToken } from "@/lib/share";
import { slugifyPredio } from "@/lib/timeline";

const PREDIO_NOME = "Condomínio Solar das Acácias";
const ENDERECO =
  "Av. Nossa Senhora da Penha, 1200, Praia do Canto, Vitória - ES";
const PRODUTOR = { nome: "Eng. Marina Costa", crea: "CREA-ES 045678/D" };

// Não-conformidades reaproveitadas entre laudos. A MESMA descrição/equipamento
// é o que casa a NC ao longo do tempo (o diff é por descrição normalizada +
// equipamento), então manter o texto idêntico é de propósito.
const FOLGA = {
  descricao:
    "Folga excessiva entre as guias e o contrapeso do Elevador Social 01.",
  plainPt:
    "O contrapeso do elevador está com mais folga que o aceitável — pode gerar trepidação e desgaste se não ajustado.",
  itemNbr: "NBR 16858-1, 5.7",
  acao: "Ajustar as guias e reapertar a fixação do contrapeso.",
};
const FREIO = {
  descricao:
    "Sistema de freio de emergência do Elevador Social 01 com tempo de resposta acima do especificado.",
  plainPt:
    "O freio de segurança do elevador está reagindo devagar. É o item que mais pesa na segurança — exige correção imediata.",
  itemNbr: "NBR 16858-1, 5.6.2",
  acao: "Substituir o conjunto do freio e revalidar o tempo de frenagem.",
  prazo: "imediato",
};
const ILUMINACAO = {
  descricao:
    "Iluminação de emergência da cabine do Elevador Social 01 inoperante.",
  plainPt:
    "Se faltar energia, a cabine fica no escuro. Incomoda, mas não impede o uso seguro.",
  itemNbr: "NBR 16858-1, 5.4.10",
  acao: "Trocar a bateria e a luminária de emergência da cabine.",
};
const SINALIZACAO = {
  descricao:
    "Ausência de placa de sinalização de capacidade máxima no Elevador de Serviço.",
  plainPt:
    "Falta a plaquinha que informa o peso máximo do elevador de serviço — fácil de resolver.",
  itemNbr: "NBR 16858-1, 5.4.4",
  acao: "Instalar a placa de capacidade máxima na cabine.",
};
const PISO = {
  descricao: "Desgaste no revestimento do piso da cabine do Elevador de Serviço.",
  plainPt:
    "O piso da cabine do elevador de serviço está gasto. É estético/preventivo, sem risco imediato.",
  acao: "Refazer o revestimento do piso da cabine.",
};

type Snapshot = {
  data: string;
  publicadoEm: Date;
  statusGeral: LaudoExtraido["statusGeral"];
  social: { sev: "urgente" | "atencao" | "leve"; base: Record<string, unknown> }[];
  servico: { sev: "urgente" | "atencao" | "leve"; base: Record<string, unknown> }[];
};

// A evolução, ano a ano:
// 2024 — atenção: folga (atenção), iluminação (leve), sinalização (leve).
// 2025 — urgente: folga AGRAVA p/ urgente, surge FREIO urgente; iluminação RESOLVIDA.
// 2026 — atenção: freio RESOLVIDO, folga AMENIZA p/ atenção; sinalização RESOLVIDA,
//          surge desgaste de piso (leve).
const SNAPSHOTS: Snapshot[] = [
  {
    data: "10/03/2024",
    publicadoEm: new Date("2024-03-12T12:00:00Z"),
    statusGeral: "atencao",
    social: [
      { sev: "atencao", base: FOLGA },
      { sev: "leve", base: ILUMINACAO },
    ],
    servico: [{ sev: "leve", base: SINALIZACAO }],
  },
  {
    data: "15/04/2025",
    publicadoEm: new Date("2025-04-17T12:00:00Z"),
    statusGeral: "urgente",
    social: [
      { sev: "urgente", base: FOLGA },
      { sev: "urgente", base: FREIO },
    ],
    servico: [{ sev: "leve", base: SINALIZACAO }],
  },
  {
    data: "20/05/2026",
    publicadoEm: new Date("2026-05-22T12:00:00Z"),
    statusGeral: "atencao",
    social: [{ sev: "atencao", base: FOLGA }],
    servico: [{ sev: "leve", base: PISO }],
  },
];

function montarExtracao(s: Snapshot): LaudoExtraido {
  const nc = (item: {
    sev: "urgente" | "atencao" | "leve";
    base: Record<string, unknown>;
  }) => ({ ...item.base, severidade: item.sev });

  const bruto = {
    predio: { nome: PREDIO_NOME, endereco: ENDERECO },
    produtor: PRODUTOR,
    equipamentos: [
      {
        identificacao: "Elevador Social 01",
        tipo: "elétrico de tração",
        naoConformidades: s.social.map(nc),
      },
      {
        identificacao: "Elevador de Serviço",
        tipo: "elétrico de tração",
        naoConformidades: s.servico.map(nc),
      },
    ],
    dataInspecao: s.data,
    statusGeral: s.statusGeral,
  };

  // Valida contra a fonte da verdade — se o seed divergir do schema, falha aqui.
  return laudoSchema.parse(bruto);
}

async function main() {
  const predioKey = slugifyPredio(PREDIO_NOME);

  // Idempotência: limpa o prédio-seed antes de reinserir. Só este prédio.
  const apagados = await db
    .delete(laudos)
    .where(eq(laudos.predioKey, predioKey))
    .returning({ id: laudos.id });
  console.log(`Limpou ${apagados.length} laudo(s) anterior(es) do seed.`);

  for (const s of SNAPSHOTS) {
    const extracao = montarExtracao(s);
    await db.insert(laudos).values({
      status: "publicado",
      blobUrl: "seed://timeline/no-pdf",
      blobPathname: `seed/timeline/${predioKey}-${s.data.replace(/\//g, "-")}.pdf`,
      fileName: `seed-timeline-${PREDIO_NOME}-${s.data.replace(/\//g, "-")}.pdf`,
      fileSize: 0,
      extracao,
      extraidoEm: s.publicadoEm,
      assinanteNome: PRODUTOR.nome,
      assinanteCrea: PRODUTOR.crea,
      publicadoEm: s.publicadoEm,
      shareToken: generateShareToken(),
      predioKey,
      createdAt: s.publicadoEm,
    });
    const total = extracao.equipamentos.reduce(
      (n, e) => n + e.naoConformidades.length,
      0,
    );
    console.log(`+ ${s.data} — ${s.statusGeral} — ${total} NC(s)`);
  }

  console.log(`\nSeed pronto. Timeline em /predios/${predioKey}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
