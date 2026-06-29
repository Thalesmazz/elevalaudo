import "server-only";

import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";

import type { Laudo } from "@/db/schema";
import { getBranding } from "@/lib/branding";
import { downloadProducerLogo } from "@/lib/blob";
import { LaudoDocument, type PdfBranding } from "@/lib/pdf/laudo-document";
import type { LaudoExtraido } from "@/lib/schema/laudo";

export function slugifyPdfFileName(s: string): string {
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

async function getPdfBranding(): Promise<PdfBranding> {
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
      logoSrc = null;
    }
  }

  return {
    nome: branding.nome,
    corPrimaria: branding.corPrimaria,
    logoSrc,
  };
}

export async function renderLaudoPdf({
  laudo,
  extracao,
}: {
  laudo: Pick<Laudo, "assinanteNome" | "assinanteCrea" | "publicadoEm">;
  extracao: LaudoExtraido;
}): Promise<Buffer> {
  const branding = await getPdfBranding();

  return renderToBuffer(
    createElement(LaudoDocument, {
      laudo,
      extracao,
      branding,
    }) as ReactElement<DocumentProps>,
  );
}
