import { get, put } from "@vercel/blob";

// PDFs originais ficam no Vercel Blob privado (NEVER-DO: dado de cliente não
// pode vazar em URL pública). O acesso de leitura passa por `get(..., { access:
// "private" })` server-side — ver lib/ai/extract.ts.

export const PDF_MIME = "application/pdf";
export const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

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
