"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { producers } from "@/db/schema";
import { normalizeHexColor, getOrCreateProducer } from "@/lib/branding";
import {
  LOGO_MIMES,
  MAX_LOGO_BYTES,
  deleteProducerLogo,
  uploadProducerLogo,
} from "@/lib/blob";

export type BrandingState = { erro?: string; ok?: boolean };

/**
 * Salva o branding do produtor (P4 `producer-branding`): nome, cor primária e,
 * opcionalmente, uma nova logo (PNG/JPEG → Blob público). Singleton — atualiza a
 * única linha de `producers`. Sem auth no MVP (NEVER-DO: nada de RBAC ainda).
 */
export async function salvarBranding(
  _prev: BrandingState,
  formData: FormData,
): Promise<BrandingState> {
  const producer = await getOrCreateProducer();

  const nomeRaw = (formData.get("nome") as string | null)?.trim() ?? "";
  const nome = nomeRaw.slice(0, 120) || null;

  const corRaw = (formData.get("corPrimaria") as string | null) ?? "";
  // Campo vazio = limpar a cor; valor preenchido precisa ser hex válido.
  const cor = corRaw.trim() ? normalizeHexColor(corRaw) : null;
  if (corRaw.trim() && !cor) {
    return { erro: "Cor inválida. Use um hex como #0a5c3a." };
  }

  let logoUrl = producer.logoUrl;
  let logoPathname = producer.logoPathname;

  const removerLogo = formData.get("removerLogo") === "on";
  const file = formData.get("logo");
  const temNovaLogo = file instanceof File && file.size > 0;

  if (temNovaLogo) {
    const f = file as File;
    if (!LOGO_MIMES.includes(f.type as (typeof LOGO_MIMES)[number])) {
      return { erro: "A logo precisa ser PNG ou JPEG." };
    }
    if (f.size > MAX_LOGO_BYTES) {
      return { erro: "Logo muito grande (máx. 2 MB)." };
    }
    const up = await uploadProducerLogo(producer.id, f);
    // Troca: apaga a logo anterior do Blob pra não deixar órfã.
    if (producer.logoUrl) await deleteProducerLogo(producer.logoUrl);
    logoUrl = up.logoUrl;
    logoPathname = up.logoPathname;
  } else if (removerLogo && producer.logoUrl) {
    await deleteProducerLogo(producer.logoUrl);
    logoUrl = null;
    logoPathname = null;
  }

  await db
    .update(producers)
    .set({ nome, corPrimaria: cor, logoUrl, logoPathname })
    .where(eq(producers.id, producer.id));

  // O branding aparece no dashboard e nos links públicos — revalida tudo.
  revalidatePath("/produtor");
  revalidatePath("/laudos", "layout");
  revalidatePath("/r", "layout");

  return { ok: true };
}
