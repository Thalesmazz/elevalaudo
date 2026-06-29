import { redirect } from "next/navigation";

// A home autenticada cai direto no painel de laudos — a lateral é a navegação
// principal. Quem não tem sessão nem chega aqui (middleware → /login).
export default function Home() {
  redirect("/laudos");
}
