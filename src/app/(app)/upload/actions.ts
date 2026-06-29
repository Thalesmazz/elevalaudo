"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { empresas, laudos } from "@/db/schema";
import { getSessao } from "@/lib/auth/session";
import { processarLaudo } from "@/lib/ai/process";
import { MAX_PDF_BYTES, PDF_MIME, uploadLaudoPdf } from "@/lib/blob";

export type UploadState = { erro?: string };

/**
 * Recebe o PDF do laudo, valida, sobe pro Blob privado e cria o registro
 * `laudo` com status `extraindo`. Amarra a extração ao usuário logado e à
 * empresa/cliente escolhida (existente ou nova), pra alimentar a lateral.
 * Redireciona pra página do laudo.
 */
export async function uploadLaudo(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const sessao = await getSessao();
  if (!sessao) {
    return { erro: "Sessão expirada. Entre novamente." };
  }

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

  // Empresa: id existente OU nome de uma nova. Sem empresa não dá pra agrupar.
  const empresaIdRaw = (formData.get("empresaId") as string | null)?.trim();
  const empresaNomeRaw = (
    formData.get("empresaNome") as string | null
  )?.trim();

  let empresaId: string;
  if (empresaIdRaw) {
    // Confere que a empresa pertence ao usuário (evita id forjado).
    const [dono] = await db
      .select({ id: empresas.id })
      .from(empresas)
      .where(
        and(
          eq(empresas.id, empresaIdRaw),
          eq(empresas.ownerUserId, sessao.user.id),
        ),
      )
      .limit(1);
    if (!dono) return { erro: "Empresa inválida." };
    empresaId = empresaIdRaw;
  } else if (empresaNomeRaw && empresaNomeRaw.length >= 2) {
    const [nova] = await db
      .insert(empresas)
      .values({ nome: empresaNomeRaw, ownerUserId: sessao.user.id })
      .returning({ id: empresas.id });
    empresaId = nova.id;
  } else {
    return { erro: "Escolha ou crie uma empresa para a extração." };
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
    userId: sessao.user.id,
    empresaId,
  });

  // Extração roda após a resposta (não trava o redirect). O laudo para em
  // `revisar`; publicar é passo humano (P2).
  after(() => processarLaudo(id));

  redirect(`/laudos/${id}`);
}
