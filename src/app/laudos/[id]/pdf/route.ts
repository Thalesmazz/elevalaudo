import { eq } from "drizzle-orm";

import { db } from "@/db";
import { laudos } from "@/db/schema";
import { downloadLaudoPdf } from "@/lib/blob";

// Entrega o PDF original (Blob privado) pro engenheiro abrir e conferir na
// revisão (P2). Server-side autenticado por OIDC; o id é um uuid não
// adivinhável. noindex pra nunca ser indexado (NEVER-DO).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [laudo] = await db.select().from(laudos).where(eq(laudos.id, id));
  if (!laudo) return new Response("Laudo não encontrado", { status: 404 });

  const bytes = await downloadLaudoPdf(laudo.blobPathname);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(laudo.fileName)}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
