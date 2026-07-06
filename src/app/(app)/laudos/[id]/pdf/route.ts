import { getSessao } from "@/lib/auth/session";
import { downloadLaudoPdf } from "@/lib/blob";
import { getLaudoAcessivelPorUsuario } from "@/lib/laudo-access";

// Entrega o PDF original (Blob privado) pro engenheiro abrir e conferir na
// revisão (P2). Server-side autenticado por OIDC; o id é um uuid não
// adivinhável. noindex pra nunca ser indexado (NEVER-DO).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const sessao = await getSessao();
  if (!sessao) return new Response("Não autenticado", { status: 401 });

  const acesso = await getLaudoAcessivelPorUsuario(id, sessao.user);
  if (!acesso) return new Response("Laudo não encontrado", { status: 404 });
  if (acesso.origem !== "proprio") {
    return new Response("Sem permissão para acessar este PDF", { status: 403 });
  }

  const { laudo } = acesso;

  // Laudo montado manualmente (`rascunho`/sem upload) não tem PDF original.
  if (!laudo.blobPathname) {
    return new Response("Este laudo não tem PDF original", { status: 404 });
  }

  const bytes = await downloadLaudoPdf(laudo.blobPathname);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(laudo.fileName ?? "laudo.pdf")}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
