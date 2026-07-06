"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { head } from "@vercel/blob";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { getSessao } from "@/lib/auth/session";
import { processarLaudo } from "@/lib/ai/process";
import { MAX_PDF_BYTES, PDF_MIME } from "@/lib/blob";
import { resolverEmpresaDoForm } from "@/lib/empresa-resolver";

export type UploadState = { erro?: string };

// O PDF sobe do browser direto pro Blob privado (rota /api/upload/token) —
// o body da server action era cortado em ~4.5 MB na Vercel (auditoria
// 2026-07). Esta action só REGISTRA o laudo, depois de conferir o blob
// server-side.

const PATHNAME_RE =
  /^laudos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.pdf$/;

/**
 * Registra o laudo após o upload client-side: valida sessão e empresa,
 * confere o blob com head() (existe, é PDF, tamanho ok — nunca confia no
 * client), cria a linha `extraindo` e dispara a extração. Redireciona pra
 * página do laudo.
 */
export async function registrarLaudoEnviado(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const sessao = await getSessao();
  if (!sessao) {
    return { erro: "Sessão expirada. Entre novamente." };
  }

  const pathname = (formData.get("pathname") as string | null)?.trim() ?? "";
  const blobUrl = (formData.get("blobUrl") as string | null)?.trim() ?? "";
  const fileName =
    (formData.get("fileName") as string | null)?.trim() || "laudo.pdf";

  const idMatch = PATHNAME_RE.exec(pathname);
  if (!idMatch || !blobUrl) {
    return { erro: "Upload inválido. Tente novamente." };
  }
  const id = idMatch[1];

  // Empresa: id existente OU nome de uma nova. Sem empresa não dá pra agrupar.
  const resolvida = await resolverEmpresaDoForm(sessao.user.id, formData);
  if (resolvida.erro) return { erro: resolvida.erro };
  const empresaId = resolvida.empresaId;

  // Confere o blob de verdade — tipo e tamanho vêm do storage, não do form.
  let fileSize: number;
  try {
    const blob = await head(pathname);
    if (blob.contentType !== PDF_MIME) {
      return { erro: "O arquivo precisa ser um PDF." };
    }
    if (blob.size > MAX_PDF_BYTES) {
      return { erro: "PDF muito grande (máx. 20 MB)." };
    }
    fileSize = blob.size;
  } catch {
    return { erro: "Arquivo não encontrado. Envie novamente." };
  }

  await db.insert(laudos).values({
    id,
    status: "extraindo",
    blobUrl,
    blobPathname: pathname,
    fileName,
    fileSize,
    userId: sessao.user.id,
    empresaId,
  });

  // Extração roda após a resposta (não trava o redirect). O laudo para em
  // `revisar`; publicar é passo humano (P2).
  after(() => processarLaudo(id));

  redirect(`/laudos/${id}`);
}
