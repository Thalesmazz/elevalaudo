"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verificarSenha } from "@/lib/auth/password";
import { criarSessao } from "@/lib/auth/session";
import { checarLimite, getClientIp } from "@/lib/rate-limit";

export type LoginState = { erro?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Anti brute-force (auditoria 2026-07): por IP e por email — o segundo
  // impede ataque distribuído contra UMA conta.
  const ip = getClientIp(await headers());
  const [ipOk, emailOk] = await Promise.all([
    checarLimite("login-ip", ip, 10, 15 * 60_000),
    checarLimite("login-email", parsed.data.email, 5, 15 * 60_000),
  ]);
  if (!ipOk || !emailOk) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  // Mensagem genérica (não revela se o email existe) — boa prática de auth.
  const ok = user && (await verificarSenha(parsed.data.senha, user.senhaHash));
  if (!user || !ok) {
    return { erro: "Email ou senha incorretos." };
  }

  await criarSessao(user.id);
  redirect("/laudos");
}
