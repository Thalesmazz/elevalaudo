import { getSessao } from "@/lib/auth/session";
import { getLaudoAcessivelPorUsuario } from "@/lib/laudo-access";
import { renderLaudoPdf, slugifyPdfFileName } from "@/lib/pdf/export";

// Exportação autenticada do PDF estruturado. Diferente do `/r/[token]/pdf`,
// não exige publicação pública: a administração pode baixar o próprio laudo logo
// após a extração, e laudos recebidos continuam respeitando a conexão ativa.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const sessao = await getSessao();
  if (!sessao) return new Response("Não autenticado", { status: 401 });

  const acesso = await getLaudoAcessivelPorUsuario(id, sessao.user);
  const extracao = acesso?.laudo.extracao;
  if (!acesso || !extracao) {
    return new Response("Laudo não encontrado ou ainda sem extração", {
      status: 404,
    });
  }

  const { laudo } = acesso;
  const buffer = await renderLaudoPdf({ laudo, extracao });
  const fileName = `laudo-${slugifyPdfFileName(extracao.predio.nome)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
