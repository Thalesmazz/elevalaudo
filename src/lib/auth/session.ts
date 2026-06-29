import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

/**
 * Sessão por token opaco em cookie httpOnly (`el_session`).
 *
 * O token é aleatório e guardado na tabela `sessions` — a validação consulta o
 * banco (em vez de confiar num JWT auto-assinado), então logout = revogar de
 * verdade. O cookie é httpOnly + sameSite lax + secure em produção: não dá pra
 * ler por JS nem vaza em navegação cross-site comum.
 *
 * Uso: Server Components/Actions chamam `getSessao()`. O `middleware.ts` só olha
 * a PRESENÇA do cookie pra um gate barato; a validação real mora aqui.
 */

export const COOKIE_SESSAO = "el_session";
const DIAS_VALIDADE = 30;

export async function criarSessao(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + DIAS_VALIDADE * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({ userId, token, expiresAt });

  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export type Sessao = { user: User };

/**
 * Lê o cookie, valida o token contra a tabela (não-expirado) e devolve o
 * usuário. Retorna null se não houver sessão válida — o caller redireciona.
 */
export async function getSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (!token) return null;

  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return row ? { user: row.user } : null;
}

/** Logout: apaga a sessão do banco e limpa o cookie. */
export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
    jar.delete(COOKIE_SESSAO);
  }
}
