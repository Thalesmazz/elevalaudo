import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { BadgeCheck, Download } from "lucide-react";

import { StatusHero } from "@/components/dashboard/status-hero";
import { NcList } from "@/components/dashboard/nc-list";
import { ComplianceSeal } from "@/components/dashboard/compliance-seal";
import { BrandHeader } from "@/components/dashboard/brand-header";
import { LaudoChat } from "@/components/dashboard/laudo-chat";
import { db } from "@/db";
import { laudos } from "@/db/schema";
import { getBranding } from "@/lib/branding";

// Link público compartilhado (P4, ADR-006). Privacidade > indexação: o laudo
// nunca pode cair no Google. `noindex, nofollow` na rota inteira. Também sem
// cache estático — o token é segredo, cada acesso revalida no banco.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Posse do link = acesso, mas o conteúdo muda (publicar/re-publicar). Renderiza
// dinâmico, sem guardar HTML em CDN.
export const dynamic = "force-dynamic";

async function getLaudoPublicado(token: string) {
  // Só `publicado` é visível pelo link (ADR-006 / guardrail de liability):
  // laudo em `extraindo`/`revisar` não vaza pro síndico. Filtra no banco, não
  // depois — token de laudo não-publicado responde igual a token inexistente.
  const [laudo] = await db
    .select()
    .from(laudos)
    .where(
      and(eq(laudos.shareToken, token), eq(laudos.status, "publicado")),
    );
  return laudo ?? null;
}

export default async function LaudoPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const laudo = await getLaudoPublicado(token);
  // 404 genérico pra token inválido, não-publicado ou inexistente — não revela
  // se o laudo existe.
  if (!laudo || !laudo.extracao) notFound();

  const branding = await getBranding();
  const extracao = laudo.extracao;
  const totalNc = extracao.equipamentos.reduce(
    (n, eq) => n + eq.naoConformidades.length,
    0,
  );
  const urgentes = extracao.equipamentos.reduce(
    (n, eq) =>
      n + eq.naoConformidades.filter((nc) => nc.severidade === "urgente").length,
    0,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <BrandHeader branding={branding} />

      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Laudo do elevador
        </p>
        <h1 className="text-xl font-semibold tracking-tight">
          {extracao.predio.nome}
        </h1>
      </div>

      {/* PDF branded self-contained (P4): o síndico baixa e guarda/imprime, sem
          login. attachment no route handler força o download do arquivo. */}
      <a
        href={`/r/${token}/pdf`}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
      >
        <Download className="size-4" strokeWidth={2} />
        Baixar PDF do laudo
      </a>

      <StatusHero
        status={extracao.statusGeral}
        predio={extracao.predio.nome}
        totalNc={totalNc}
        urgentes={urgentes}
        equipamentos={extracao.equipamentos.length}
        dataInspecao={extracao.dataInspecao}
      />
      <NcList equipamentos={extracao.equipamentos} />
      <ComplianceSeal
        dataInspecao={extracao.dataInspecao}
        endereco={extracao.predio.endereco}
      />
      <LaudoChat api={`/api/r/${token}/chat`} />

      {/* Quem revisou e assinou — fecha a confiança do síndico (ADR-002). */}
      <div className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900">
        <BadgeCheck className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
        <div className="space-y-0.5">
          <p className="font-medium">Revisado e assinado pelo responsável técnico</p>
          <p>
            {laudo.assinanteNome}
            {laudo.assinanteCrea ? ` · ${laudo.assinanteCrea}` : ""}
            {laudo.publicadoEm
              ? ` · ${laudo.publicadoEm.toLocaleDateString("pt-BR")}`
              : ""}
          </p>
        </div>
      </div>
    </main>
  );
}
