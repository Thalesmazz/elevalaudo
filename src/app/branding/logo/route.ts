import { getBranding } from "@/lib/branding";
import { downloadProducerLogo } from "@/lib/blob";

// Serve a logo do produtor (P4 `producer-branding`). O store Blob é privado, então
// a imagem não tem URL pública — esta rota lê os bytes server-side (OIDC) e os
// entrega same-origin pro <img> do dashboard/link público. A logo é a marca do
// produtor (não dado sigiloso de cliente), logo pode ser cacheada.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const branding = await getBranding();
  if (!branding.logoPathname) {
    return new Response("Sem logo", { status: 404 });
  }

  const bytes = await downloadProducerLogo(branding.logoPathname);
  const contentType = branding.logoPathname.endsWith(".png")
    ? "image/png"
    : "image/jpeg";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      // URL versionada por ?v= (updatedAt) — pode cachear forte; trocar a logo
      // muda a URL e fura o cache.
      "Cache-Control": "public, max-age=86400",
    },
  });
}
