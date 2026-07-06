import { slugifyPredio } from "@/lib/timeline";
import type { LaudoDaEmpresa } from "@/lib/empresas-db";

/**
 * Agrupamento de extrações por prédio, compartilhado entre a lateral
 * (Empresa → Prédio → extrações) e os "Gráficos por prédio" da home. Sem
 * `server-only`: usa só `slugifyPredio` (função pura) e o tipo
 * `LaudoDaEmpresa`, então roda tanto no server quanto no client.
 */

export type PredioGrupo = {
  key: string;
  nome: string;
  laudos: LaudoDaEmpresa[];
  publicados: number;
};

/** Agrupa as extrações de uma empresa por prédio (slug normalizado do nome). */
export function agruparPorPredio(laudos: LaudoDaEmpresa[]): PredioGrupo[] {
  const map = new Map<string, PredioGrupo>();
  for (const l of laudos) {
    const key = slugifyPredio(l.titulo) || l.id;
    const g = map.get(key) ?? { key, nome: l.titulo, laudos: [], publicados: 0 };
    g.laudos.push(l);
    if (l.status === "publicado") g.publicados += 1;
    map.set(key, g);
  }
  return [...map.values()];
}
