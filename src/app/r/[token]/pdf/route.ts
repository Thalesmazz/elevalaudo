import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { getBranding } from "@/lib/branding";
import { downloadProducerLogo } from "@/lib/blob";
import { LaudoDocument, type PdfBranding } from "@/lib/pdf/laudo-document";

// PDF branded self-contained do laudo (P4 `branded-pdf-export`). Mesmo gate do
// `/r/[token]` (ADR-006): só laudo `publicado` é baixável pelo link, sem login.
// renderToBuffer roda em Node (react-pdf não é edge) e monta o PDF na hora.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "laudo"
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // 404 genérico (igual à página) — não revela se o token/laudo existe.
  const [laudo] = await db
    .select()
    .from(laudos)
    .where(and(eq(laudos.shareToken, token), eq(laudos.status, "publicado")));
  if (!laudo || !laudo.extracao) {
    return new Response("Não encontrado", { status: 404 });
  }

  // Branding white-label do produtor (P4) — logo/cor na capa do PDF. A logo vem
  // do Blob privado como bytes → data-URI (react-pdf não busca rota same-origin).
  const branding = await getBranding();
  let logoSrc: string | null = null;
  if (branding.logoPathname) {
    try {
      const bytes = await downloadProducerLogo(branding.logoPathname);
      const mime = branding.logoPathname.endsWith(".png")
        ? "image/png"
        : "image/jpeg";
      logoSrc = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    } catch {
      // Logo indisponível não pode travar o PDF — cai no nome/wordmark.
      logoSrc = null;
    }
  }
  const pdfBranding: PdfBranding = {
    nome: branding.nome,
    corPrimaria: branding.corPrimaria,
    logoSrc,
  };

  // LaudoDocument retorna um <Document>, mas o TS de renderToBuffer espera o
  // elemento Document direto (não um wrapper). Runtime ok; cast resolve o tipo.
  const buffer = await renderToBuffer(
    createElement(LaudoDocument, {
      laudo,
      extracao: laudo.extracao,
      branding: pdfBranding,
    }) as ReactElement<DocumentProps>,
  );

  const fileName = `laudo-${slugify(laudo.extracao.predio.nome)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      // Token é segredo — nunca cachear em CDN nem indexar.
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
