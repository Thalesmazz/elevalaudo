"use server";

import { redirect } from "next/navigation";

import { encerrarSessao } from "@/lib/auth/session";

/** Logout: revoga a sessão e volta pro login. Usado pelo botão da lateral. */
export async function logout() {
  await encerrarSessao();
  redirect("/login");
}
