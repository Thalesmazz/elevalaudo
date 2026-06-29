"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verificarSenha } from "@/lib/auth/password";
import { criarSessao } from "@/lib/auth/session";

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
