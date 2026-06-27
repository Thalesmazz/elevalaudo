import { cache } from "react";

import { db } from "@/db";
import { producers, type Producer } from "@/db/schema";

/**
 * Branding white-label do produtor (P4 `producer-branding`).
 *
 * MVP é singleton: 1 design partner, sem auth → existe no máximo uma linha em
 * `producers`. `getBranding()` lê essa linha; `getOrCreateProducer()` garante a
 * linha pro form de configuração. Quando entrar login, isto vira lookup por
 * produtor (NEVER-DO: nada de multi-tenant no MVP).
 *
 * A logo e a cor pintam dashboard, link público e PDF — mas NUNCA as cores RAG
 * do semáforo (honestidade visual > marca).
 */

export type Branding = {
  nome: string | null;
  /** URL same-origin pra exibir a logo (<img>), versionada p/ furar cache. Null se não há logo. */
  logoSrc: string | null;
  /** Pathname no Blob privado — leitura server-side (PDF). Null se não há logo. */
  logoPathname: string | null;
  /** Cor primária validada (#rrggbb) ou null. Já segura pra CSS/PDF. */
  corPrimaria: string | null;
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Normaliza a cor pra `#rrggbb` minúsculo, ou null se inválida. */
export function normalizeHexColor(input: string | null | undefined): string | null {
  if (!input) return null;
  let v = input.trim().toLowerCase();
  if (!v.startsWith("#")) v = `#${v}`;
  // Aceita atalho de 3 dígitos (#abc → #aabbcc).
  if (/^#[0-9a-f]{3}$/.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return HEX_RE.test(v) ? v : null;
}

function toBranding(row: Producer | undefined): Branding {
  if (!row) {
    return { nome: null, logoSrc: null, logoPathname: null, corPrimaria: null };
  }
  // `?v=` versiona pelo updatedAt — trocar a logo invalida o cache do <img>.
  const logoSrc = row.logoPathname
    ? `/branding/logo?v=${row.updatedAt.getTime()}`
    : null;
  return {
    nome: row.nome?.trim() || null,
    logoSrc,
    logoPathname: row.logoPathname || null,
    corPrimaria: normalizeHexColor(row.corPrimaria),
  };
}

/**
 * Branding do produtor pra renderizar (dashboard/público/PDF). `cache()` evita
 * reconsultar o banco quando dashboard e PDF pedem na mesma request.
 */
export const getBranding = cache(async (): Promise<Branding> => {
  const [row] = await db.select().from(producers).limit(1);
  return toBranding(row);
});

/** Linha do produtor pro form de configuração (cria a singleton se faltar). */
export async function getOrCreateProducer(): Promise<Producer> {
  const [existing] = await db.select().from(producers).limit(1);
  if (existing) return existing;
  const [criado] = await db.insert(producers).values({}).returning();
  return criado;
}
