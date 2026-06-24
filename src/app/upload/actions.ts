"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { processarLaudo } from "@/lib/ai/process";
import { MAX_PDF_BYTES, PDF_MIME, uploadLaudoPdf } from "@/lib/blob";

export type UploadState = { erro?: string };

/**
 * Recebe o PDF do laudo, valida, sobe pro Blob privado e cria o registro
 * `laudo` com status `extraindo`. Redireciona pra página do laudo.
 *
 * A extração (claude-extract-generateobject) é disparada daqui no item
 * seguinte do P1.
 */
export async function uploadLaudo(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const file = formData.get("pdf");

  if (!(file instanceof File) || file.size === 0) {
    return { erro: "Selecione um arquivo PDF do laudo." };
  }
  if (file.type !== PDF_MIME) {
    return { erro: "O arquivo precisa ser um PDF." };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { erro: "PDF muito grande (máx. 20 MB)." };
  }

  const id = crypto.randomUUID();

  const upload = await uploadLaudoPdf(id, file);

  await db.insert(laudos).values({
    id,
    status: "extraindo",
    blobUrl: upload.blobUrl,
    blobPathname: upload.blobPathname,
    fileName: upload.fileName,
    fileSize: upload.fileSize,
  });

  // Extração roda após a resposta (não trava o redirect). O laudo para em
  // `revisar`; publicar é passo humano (P2).
  after(() => processarLaudo(id));

  redirect(`/laudos/${id}`);
}
