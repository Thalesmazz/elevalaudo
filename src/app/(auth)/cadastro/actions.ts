"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashSenha } from "@/lib/auth/password";
import { criarSessao } from "@/lib/auth/session";

export type CadastroState = { erro?: string };

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  senha: z.string().min(8, "A senha precisa de ao menos 8 caracteres."),
  role: z.enum(["engenheiro", "gestor"]),
});

export async function cadastrar(
  _prev: CadastroState,
  formData: FormData,
): Promise<CadastroState> {
  const parsed = schema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, email, senha, role } = parsed.data;

  const [existente] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existente) {
    return { erro: "Já existe uma conta com esse email." };
  }

  const senhaHash = await hashSenha(senha);
  const [user] = await db
    .insert(users)
    .values({ nome, email, senhaHash, role })
    .returning({ id: users.id });

  await criarSessao(user.id);
  redirect("/laudos");
}
