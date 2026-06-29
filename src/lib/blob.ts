import { del, get, put } from "@vercel/blob";

// PDFs originais ficam no Vercel Blob privado (NEVER-DO: dado de cliente não
// pode vazar em URL pública). O acesso de leitura passa por `get(..., { access:
// "private" })` server-side — ver lib/ai/extract.ts.

export const PDF_MIME = "application/pdf";
export const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

// Logo do produtor (P4 `producer-branding`). PNG/JPEG só — react-pdf desenha o
// `<Image>` com esses formatos (SVG não). O store Blob do projeto é PRIVADO
// (provisionado assim no P0), então a logo vai privada como o PDF e é servida
// pela rota /branding/logo (server-side); no PDF entra como bytes.
export const LOGO_MIMES = ["image/png", "image/jpeg"] as const;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export type PdfUpload = {
  blobUrl: string;
  blobPathname: string;
  fileName: string;
  fileSize: number;
};

/**
 * Sobe o PDF do laudo pro Blob privado sob `laudos/<id>.pdf`.
 * O `id` (uuid do registro) garante pathname único e idempotente.
 */
export async function uploadLaudoPdf(
  id: string,
  file: File,
): Promise<PdfUpload> {
  const pathname = `laudos/${id}.pdf`;

  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: PDF_MIME,
    allowOverwrite: true,
  });

  return {
    blobUrl: blob.url,
    blobPathname: blob.pathname,
    fileName: file.name,
    fileSize: file.size,
  };
}

export type LogoUpload = {
  logoUrl: string;
  logoPathname: string;
};

/**
 * Sobe a logo do produtor pro Blob PRIVADO sob `branding/<producerId>-<ts>.<ext>`.
 * `addRandomSuffix` + timestamp dão pathname único (e desencavam cache velho ao
 * trocar). A leitura passa pela rota /branding/logo (server-side, OIDC).
 */
export async function uploadProducerLogo(
  producerId: string,
  file: File,
): Promise<LogoUpload> {
  const ext = file.type === "image/png" ? "png" : "jpg";
  const pathname = `branding/${producerId}-${Date.now()}.${ext}`;

  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
  });

  return { logoUrl: blob.url, logoPathname: blob.pathname };
}

/** Lê os bytes da logo do Blob privado (server-side) — rota /branding/logo + PDF. */
export async function downloadProducerLogo(
  pathname: string,
): Promise<Uint8Array> {
  const res = await get(pathname, { access: "private" });
  if (!res) throw new Error(`Logo não encontrada no Blob: ${pathname}`);
  const buffer = await new Response(res.stream).arrayBuffer();
  return new Uint8Array(buffer);
}

/** Remove a logo antiga do Blob ao trocar/limpar (best-effort, não trava o fluxo). */
export async function deleteProducerLogo(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // Logo órfã no Blob não quebra o produto — ignora falha de limpeza.
  }
}

/** Remove o PDF do laudo do Blob ao excluir a extração (best-effort). */
export async function deleteLaudoPdf(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // PDF órfão no Blob não quebra o produto — ignora falha de limpeza.
  }
}

/**
 * Baixa os bytes do PDF do Blob privado (server-side, autenticado por OIDC).
 * Usado pela extração — nunca expõe o PDF por URL pública.
 */
export async function downloadLaudoPdf(
  pathname: string,
): Promise<Uint8Array> {
  const res = await get(pathname, { access: "private" });
  if (!res) {
    throw new Error(`PDF não encontrado no Blob: ${pathname}`);
  }
  const buffer = await new Response(res.stream).arrayBuffer();
  return new Uint8Array(buffer);
}
