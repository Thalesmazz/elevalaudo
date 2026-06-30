import Link from "next/link";
import { redirect } from "next/navigation";
import { FilePlus2 } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { Logo } from "@/components/logo";
import { getSessao } from "@/lib/auth/session";
import { getEmpresasDoUsuario } from "@/lib/empresas-db";

/**
 * Shell autenticado: lateral (estilo Claude Code) + conteúdo. Tudo aqui exige
 * sessão — sem ela, volta pro login (o middleware já barra, isto é a defesa em
 * profundidade do Server Component). As telas públicas (`/r/*`) e de auth ficam
 * FORA deste grupo, então não herdam a lateral.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const empresas = await getEmpresasDoUsuario(sessao.user.id);
  const user = { nome: sessao.user.nome, role: sessao.user.role };

  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar user={user} empresas={empresas} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo mobile (a lateral some no md-) */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/88 px-4 py-2.5 shadow-sm backdrop-blur-xl md:hidden">
          <Link href="/" className="flex items-center">
            <Logo markClassName="size-8" wordClassName="text-lg" />
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[color-mix(in_oklch,var(--primary),black_12%)] active:translate-y-px"
          >
            <FilePlus2 className="size-4" strokeWidth={2.25} />
            Nova extração
          </Link>
        </header>

        {children}
      </div>
    </div>
  );
}
