import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import type { Laudo } from "@/db/schema";
import type { LaudoExtraido, NaoConformidade } from "@/lib/schema/laudo";
import { estimarCompliance, resolverCidade } from "@/lib/compliance";

/**
 * Branding do PDF (P4 `producer-branding`). Diferente do `Branding` do app: o
 * render é server-side e o Blob é privado, então a logo chega como data-URI
 * (bytes embutidos), não como URL — react-pdf não busca rota same-origin.
 */
export type PdfBranding = {
  nome: string | null;
  corPrimaria: string | null;
  /** Logo como data-URI (`data:image/png;base64,…`) ou null. */
  logoSrc?: string | null;
};

/**
 * PDF branded self-contained do laudo (P4 `branded-pdf-export`).
 *
 * Montado com @react-pdf/renderer — componentes (`<Page>`, `<Text>`) viram PDF,
 * em vez de "imprimir a tela". Consistente, independe do navegador do síndico e
 * abre offline (um arquivo só, fontes Helvetica embutidas, sem rede).
 *
 * Estrutura: capa branded → sumário executivo → não-conformidades (rankeadas) →
 * rodapé em toda página com o responsável técnico/CREA (NEVER-DO: nunca remover).
 *
 * Liability (ADR-002): o PDF COMUNICA o que o laudo diz, não certifica
 * segurança. O selo de compliance é estimativa; a assinatura é do RT humano.
 */

// Paleta — neutro premium (Vercel/Linear) + sistema RAG. Hex porque react-pdf
// não entende Tailwind/oklch; espelha o vocabulário de cor de `status.ts`.
const C = {
  ink: "#18181b",
  inkSoft: "#3f3f46",
  muted: "#71717a",
  faint: "#a1a1aa",
  line: "#e4e4e7",
  bgSoft: "#fafafa",
  white: "#ffffff",
} as const;

type RagTone = {
  fg: string;
  bg: string;
  border: string;
  label: string;
  /** Leitura do laudo, liability-safe (espelha statusConfig.message). */
  message: string;
};

const STATUS_TONE: Record<LaudoExtraido["statusGeral"], RagTone> = {
  seguro: {
    fg: "#047857",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    label: "Seguro",
    message: "O laudo não aponta pendências relevantes.",
  },
  atencao: {
    fg: "#b45309",
    bg: "#fffbeb",
    border: "#fcd34d",
    label: "Atenção",
    message: "Há não-conformidades a corrigir dentro do prazo.",
  },
  urgente: {
    fg: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
    label: "Urgente",
    message: "Risco apontado no laudo. Recomenda-se ação imediata.",
  },
};

const SEV_TONE: Record<NaoConformidade["severidade"], RagTone> = {
  urgente: { ...STATUS_TONE.urgente, label: "Urgente", message: "" },
  atencao: { ...STATUS_TONE.atencao, label: "Atenção", message: "" },
  leve: {
    fg: C.inkSoft,
    bg: C.bgSoft,
    border: C.line,
    label: "Leve",
    message: "",
  },
};

const RANK: Record<NaoConformidade["severidade"], number> = {
  urgente: 0,
  atencao: 1,
  leve: 2,
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 64,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.5,
  },

  // Marca
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandLogo: { maxHeight: 26, maxWidth: 150, objectFit: "contain" },
  brandName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },
  wordmark: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  wordmarkEleva: { color: C.ink },
  wordmarkLaudo: { color: C.muted },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.muted,
    fontFamily: "Helvetica-Bold",
  },

  // Capa
  coverTopRule: {
    borderTopWidth: 2,
    borderTopColor: C.ink,
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    lineHeight: 1.15,
    marginTop: 120,
  },
  coverSub: { fontSize: 12, color: C.muted, marginTop: 8 },

  statusCard: {
    marginTop: 36,
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  statusDisc: { width: 18, height: 18, borderRadius: 9, marginTop: 4 },
  statusText: { flex: 1 },
  statusLabel: { fontSize: 22, fontFamily: "Helvetica-Bold", lineHeight: 1.1 },
  statusMsg: { fontSize: 10, color: C.inkSoft, marginTop: 5 },

  metaGrid: { marginTop: 28, flexDirection: "row", flexWrap: "wrap", gap: 0 },
  metaCell: { width: "50%", marginBottom: 14 },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.faint,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  metaValue: { fontSize: 11, color: C.ink },

  rtCard: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 14,
  },
  rtLabel: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.faint,
    fontFamily: "Helvetica-Bold",
  },
  rtName: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 3 },
  rtMeta: { fontSize: 9, color: C.muted, marginTop: 1 },

  disclaimer: {
    marginTop: 10,
    fontSize: 7.5,
    color: C.faint,
    lineHeight: 1.4,
  },

  // Seções (páginas internas). lineHeight explícito: sem ele o título herda o
  // line-height absoluto do `page` (10*1.5≈15pt), menor que o glifo de 16pt.
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    lineHeight: 1.2,
    marginBottom: 14,
  },

  // Sumário
  statRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    padding: 12,
  },
  // lineHeight próprio (1.2 do PRÓPRIO fontSize) — sem ele o número herda o
  // line-height absoluto do `page` (≈15pt), curto demais p/ o glifo de 22pt, e
  // o `statCap` sobe por cima. É a causa do desalinhamento número↔rótulo.
  statNum: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    lineHeight: 1.2,
  },
  statCap: {
    fontSize: 7.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: C.muted,
    marginTop: 4,
  },

  complianceCard: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    padding: 14,
    backgroundColor: C.bgSoft,
  },
  complianceHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  complianceTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  complianceBody: { fontSize: 9.5, color: C.inkSoft },
  complianceLaw: { fontSize: 8, color: C.muted, marginTop: 5 },

  // Não-conformidades
  ncCard: {
    borderWidth: 1,
    borderColor: C.line,
    borderLeftWidth: 4,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  ncHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  pill: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillNbr: {
    fontSize: 8,
    color: C.muted,
    backgroundColor: C.bgSoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  pillEquip: { fontSize: 8, color: C.muted },
  ncPlain: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },
  ncTech: { fontSize: 9, color: C.muted, marginTop: 4 },
  ncFooter: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  ncAcao: { fontSize: 9, color: C.inkSoft, flex: 1 },
  ncPrazo: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: C.bgSoft,
    color: C.inkSoft,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    padding: 16,
    fontSize: 10,
    color: C.muted,
  },

  // Rodapé fixo (repetido em toda página via `fixed`). Linha separadora +
  // RT à esquerda, marca/paginação à direita.
  footerRule: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  footerStrong: {
    position: "absolute",
    bottom: 26,
    left: 48,
    fontSize: 7.5,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
  },
  footerText: {
    position: "absolute",
    bottom: 26,
    // left+right dão largura à caixa; sem largura o texto absoluto right-only
    // colapsa e não renderiza. textAlign joga a paginação pra borda direita.
    left: 48,
    right: 48,
    fontSize: 7.5,
    color: C.faint,
    textAlign: "right",
  },
});

const DISCLAIMER =
  "Este documento traduz e comunica o conteúdo do laudo técnico de inspeção. Não constitui atestado de segurança nem certificação. A responsabilidade técnica é do profissional signatário. Prazos e multas de compliance são estimativas — confirme com a prefeitura.";

type RankedNc = NaoConformidade & { equipamento: string };

function Footer({ rt }: { rt: string }) {
  // Cada elemento `fixed` repete em toda página, em absoluto na margem inferior.
  // RT/CREA à esquerda (exigência de liability, NEVER-DO) + marca à direita.
  // Obs.: a paginação dinâmica (`render` + `fixed`) não renderiza no bundle do
  // Next (funciona em Node puro) — por isso a direita é a marca estática.
  return (
    <>
      <View style={styles.footerRule} fixed />
      <Text style={styles.footerStrong} fixed>
        {rt}
      </Text>
      <Text style={styles.footerText} fixed>
        ElevaLaudo · laudo de inspeção
      </Text>
    </>
  );
}

function Wordmark() {
  return (
    <Text style={styles.wordmark}>
      <Text style={styles.wordmarkEleva}>Eleva</Text>
      <Text style={styles.wordmarkLaudo}>Laudo</Text>
    </Text>
  );
}

/**
 * Marca da capa (P4 `producer-branding`): logo do produtor se houver, senão o
 * nome, com fallback no wordmark ElevaLaudo. White-label — o laudo carrega a
 * marca do produtor; o ElevaLaudo recua pro rodapé ("gerado por").
 */
function CoverBrand({ branding }: { branding?: PdfBranding }) {
  if (branding?.logoSrc) {
    // data-URI (bytes embutidos) — react-pdf desenha sem ir à rede.
    // (alt-text é regra de <img> HTML; o <Image> do react-pdf vira PDF.)
    // eslint-disable-next-line jsx-a11y/alt-text
    return <Image src={branding.logoSrc} style={styles.brandLogo} />;
  }
  if (branding?.nome) {
    return <Text style={styles.brandName}>{branding.nome}</Text>;
  }
  return <Wordmark />;
}

export function LaudoDocument({
  laudo,
  extracao,
  branding,
}: {
  laudo: Pick<Laudo, "assinanteNome" | "assinanteCrea" | "publicadoEm">;
  extracao: LaudoExtraido;
  branding?: PdfBranding;
}) {
  // Cor da marca tinge só o filete da capa (acento) — nunca as cores RAG.
  const brandColor = branding?.corPrimaria ?? undefined;
  const ncs: RankedNc[] = extracao.equipamentos
    .flatMap((eq) =>
      eq.naoConformidades.map((nc) => ({ ...nc, equipamento: eq.identificacao })),
    )
    .sort((a, b) => RANK[a.severidade] - RANK[b.severidade]);

  const totalNc = ncs.length;
  const urgentes = ncs.filter((n) => n.severidade === "urgente").length;
  const atencao = ncs.filter((n) => n.severidade === "atencao").length;
  const leves = ncs.filter((n) => n.severidade === "leve").length;
  const multiEquip = extracao.equipamentos.length > 1;

  const tone = STATUS_TONE[extracao.statusGeral];

  // RT é exigência de liability (NEVER-DO) — sempre presente; fallback honesto.
  const rtNome = extracao.produtor.nome || laudo.assinanteNome || "Responsável técnico";
  const rtCreaRaw = extracao.produtor.crea || laudo.assinanteCrea || undefined;
  // O CREA do laudo às vezes já vem com o prefixo "CREA" — não duplicar.
  const rtCrea = rtCreaRaw
    ? /^crea/i.test(rtCreaRaw.trim())
      ? rtCreaRaw.trim()
      : `CREA ${rtCreaRaw.trim()}`
    : undefined;
  const rtFooter = rtCrea ? `${rtNome} · ${rtCrea}` : rtNome;

  const cidade = resolverCidade(extracao.predio.endereco);
  const compliance = estimarCompliance(extracao.dataInspecao, cidade);

  const geradoEm = new Date().toLocaleDateString("pt-BR");
  const assinadoEm = laudo.publicadoEm
    ? new Date(laudo.publicadoEm).toLocaleDateString("pt-BR")
    : undefined;

  return (
    <Document
      title={`Laudo — ${extracao.predio.nome}`}
      author={rtNome}
      subject="Laudo de inspeção de elevador"
      creator="ElevaLaudo"
    >
      {/* ── Capa ── */}
      <Page size="A4" style={styles.page}>
        <View
          style={[
            styles.coverTopRule,
            brandColor ? { borderTopColor: brandColor } : {},
          ]}
        >
          <CoverBrand branding={branding} />
          <Text style={styles.kicker}>Laudo de Inspeção</Text>
        </View>

        <Text style={styles.coverTitle}>{extracao.predio.nome}</Text>
        <Text style={styles.coverSub}>
          Relatório de inspeção de elevador · resumo para o condomínio
        </Text>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: tone.bg, borderColor: tone.border },
          ]}
        >
          <View style={[styles.statusDisc, { backgroundColor: tone.fg }]} />
          <View style={styles.statusText}>
            <Text style={[styles.statusLabel, { color: tone.fg }]}>
              {tone.label}
            </Text>
            <Text style={styles.statusMsg}>{tone.message}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          {extracao.predio.endereco ? (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Endereço</Text>
              <Text style={styles.metaValue}>{extracao.predio.endereco}</Text>
            </View>
          ) : null}
          {extracao.dataInspecao ? (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Data da inspeção</Text>
              <Text style={styles.metaValue}>{extracao.dataInspecao}</Text>
            </View>
          ) : null}
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Equipamentos</Text>
            <Text style={styles.metaValue}>{extracao.equipamentos.length}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Não-conformidades</Text>
            <Text style={styles.metaValue}>
              {totalNc}
              {urgentes > 0 ? ` · ${urgentes} urgente${urgentes === 1 ? "" : "s"}` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.rtCard}>
          <Text style={styles.rtLabel}>Responsável técnico</Text>
          <Text style={styles.rtName}>{rtNome}</Text>
          <Text style={styles.rtMeta}>
            {rtCrea ?? "CREA não informado"}
            {assinadoEm ? ` · revisado e assinado em ${assinadoEm}` : ""}
          </Text>
          <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
          <Text style={[styles.disclaimer, { marginTop: 4 }]}>
            Documento gerado pelo ElevaLaudo em {geradoEm}.
          </Text>
        </View>

        <Footer rt={rtFooter} />
      </Page>

      {/* ── Sumário executivo + não-conformidades ── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>Sumário executivo</Text>
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>
          Visão geral do laudo
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{extracao.equipamentos.length}</Text>
            <Text style={styles.statCap}>Equipamentos</Text>
          </View>
          <View style={[styles.statBox, { borderColor: SEV_TONE.urgente.border }]}>
            <Text style={[styles.statNum, { color: SEV_TONE.urgente.fg }]}>
              {urgentes}
            </Text>
            <Text style={styles.statCap}>Urgentes</Text>
          </View>
          <View style={[styles.statBox, { borderColor: SEV_TONE.atencao.border }]}>
            <Text style={[styles.statNum, { color: SEV_TONE.atencao.fg }]}>
              {atencao}
            </Text>
            <Text style={styles.statCap}>Atenção</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{leves}</Text>
            <Text style={styles.statCap}>Leves</Text>
          </View>
        </View>

        <View style={styles.complianceCard}>
          <View style={styles.complianceHead}>
            <Text style={styles.complianceTitle}>
              Compliance do RIA
              {compliance.cidade ? ` · ${compliance.cidade.cidade}/${compliance.cidade.uf}` : ""}
            </Text>
            <Text
              style={[
                styles.pill,
                complianceTonePill(compliance.status),
              ]}
            >
              {COMPLIANCE_LABEL[compliance.status]}
            </Text>
          </View>
          <Text style={styles.complianceBody}>{compliance.resumo}</Text>
          {compliance.cidade ? (
            <Text style={styles.complianceLaw}>
              Base: {compliance.cidade.lei}
              {compliance.cidade.multaEstimada
                ? ` · multa estimada ${compliance.cidade.multaEstimada}`
                : ""}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
          Não-conformidades ({totalNc})
        </Text>

        {ncs.length === 0 ? (
          <Text style={styles.emptyState}>
            Nenhuma não-conformidade apontada no laudo.
          </Text>
        ) : (
          ncs.map((nc, i) => {
            const sev = SEV_TONE[nc.severidade];
            const plain = nc.plainPt?.trim();
            return (
              <View key={i} style={[styles.ncCard, { borderLeftColor: sev.fg }]} wrap={false}>
                <View style={styles.ncHead}>
                  <Text
                    style={[
                      styles.pill,
                      { color: sev.fg, backgroundColor: sev.bg, borderColor: sev.border },
                    ]}
                  >
                    {sev.label}
                  </Text>
                  {nc.itemNbr ? (
                    <Text style={styles.pillNbr}>NBR {nc.itemNbr}</Text>
                  ) : null}
                  {multiEquip ? (
                    <Text style={styles.pillEquip}>{nc.equipamento}</Text>
                  ) : null}
                </View>

                <Text style={styles.ncPlain}>{plain || nc.descricao}</Text>
                {plain ? (
                  <Text style={styles.ncTech}>No laudo: {nc.descricao}</Text>
                ) : null}

                <View style={styles.ncFooter}>
                  <Text style={styles.ncAcao}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>O que fazer: </Text>
                    {nc.acao}
                  </Text>
                  {nc.prazo ? (
                    <Text style={styles.ncPrazo}>Prazo: {nc.prazo}</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <Footer rt={rtFooter} />
      </Page>
    </Document>
  );
}

const COMPLIANCE_LABEL: Record<
  ReturnType<typeof estimarCompliance>["status"],
  string
> = {
  emDia: "Em dia",
  vencendo: "Vence em breve",
  vencido: "Vencido",
  semData: "Sem data",
};

function complianceTonePill(
  status: ReturnType<typeof estimarCompliance>["status"],
) {
  switch (status) {
    case "emDia":
      return { color: STATUS_TONE.seguro.fg, backgroundColor: STATUS_TONE.seguro.bg, borderColor: STATUS_TONE.seguro.border };
    case "vencendo":
      return { color: STATUS_TONE.atencao.fg, backgroundColor: STATUS_TONE.atencao.bg, borderColor: STATUS_TONE.atencao.border };
    case "vencido":
      return { color: STATUS_TONE.urgente.fg, backgroundColor: STATUS_TONE.urgente.bg, borderColor: STATUS_TONE.urgente.border };
    default:
      return { color: C.muted, backgroundColor: C.bgSoft, borderColor: C.line };
  }
}
