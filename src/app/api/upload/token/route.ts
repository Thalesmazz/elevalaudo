import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { getSessao } from "@/lib/auth/session";
import { MAX_PDF_BYTES, PDF_MIME } from "@/lib/blob";

// Token de upload client-side → Blob privado (auditoria 2026-07, TODO
// `fix-upload-bodysize`): o PDF vai do browser direto pro Blob, sem passar
// pelo body da server action — que a Vercel corta em ~4.5 MB em produção.
// O registro do laudo acontece DEPOIS, em registrarLaudoEnviado, que confere
// o blob server-side com head() (nunca confiar no client).
const PATHNAME_RE = /^laudos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        const sessao = await getSessao();
        if (!sessao) throw new Error("Não autenticado.");
        // Pathname fixo `laudos/<uuid>.pdf` e SEM allowOverwrite: um id
        // forjado de laudo existente não consegue trocar o PDF do outro.
        if (!PATHNAME_RE.test(pathname)) {
          throw new Error("Caminho de upload inválido.");
        }
        return {
          allowedContentTypes: [PDF_MIME],
          maximumSizeInBytes: MAX_PDF_BYTES,
          addRandomSuffix: false,
        };
      },
      // Registro do laudo fica na server action (roda também em localhost,
      // onde onUploadCompleted não recebe callback).
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha no upload.";
    return Response.json({ error: msg }, { status: 400 });
  }
}
