import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { conexoes, laudos, type Laudo, type User } from "@/db/schema";
import { isEngenheiro } from "@/lib/auth/roles";

export type LaudoAcessivel = {
  laudo: Laudo;
  origem: "proprio" | "recebido";
};

async function getEngenheirosConectadosIds(adminUserId: string): Promise<string[]> {
  const rows = await db
    .select({ id: conexoes.engenheiroUserId })
    .from(conexoes)
    .where(
      and(
        eq(conexoes.administracaoUserId, adminUserId),
        eq(conexoes.status, "ativa"),
      ),
    );

  return [...new Set(rows.map((r) => r.id))];
}

export async function getUserIdsVisiveisNoHistorico(user: User): Promise<string[]> {
  if (isEngenheiro(user.role)) return [user.id];
  return [user.id, ...(await getEngenheirosConectadosIds(user.id))];
}

export async function getLaudoAcessivelPorUsuario(
  id: string,
  user: User,
): Promise<LaudoAcessivel | null> {
  const [laudo] = await db.select().from(laudos).where(eq(laudos.id, id)).limit(1);
  if (!laudo) return null;

  if (laudo.userId === user.id) {
    return { laudo, origem: "proprio" };
  }

  if (isEngenheiro(user.role) || laudo.status !== "publicado" || !laudo.userId) {
    return null;
  }

  const [vinculo] = await db
    .select({ id: conexoes.id })
    .from(conexoes)
    .where(
      and(
        eq(conexoes.engenheiroUserId, laudo.userId),
        eq(conexoes.administracaoUserId, user.id),
        eq(conexoes.status, "ativa"),
      ),
    )
    .limit(1);

  return vinculo ? { laudo, origem: "recebido" } : null;
}
