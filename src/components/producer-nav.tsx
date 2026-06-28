"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileUp, LayoutList, Palette } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Barra de navegação do PRODUTOR (lado interno do app). Atalhos pra enviar um
 * novo laudo e ver a lista — sem isso, depois de cair num laudo não dá pra
 * voltar sem digitar a URL. É o esqueleto do painel do produtor logado (quando
 * o login entrar, vira o header autenticado).
 *
 * Liability/escopo: NÃO aparece no link público do síndico (`/r/[token]`), que
 * é sem login e read-only — lá ele não pode navegar pelo app do produtor. Por
 * isso o guard por pathname (Client Component só pra ler a rota; zero dado).
 */

const LINKS = [
  { href: "/upload", label: "Enviar laudo", Icon: FileUp },
  { href: "/laudos", label: "Meus laudos", Icon: LayoutList },
  { href: "/produtor", label: "Branding", Icon: Palette },
];

export function ProducerNav() {
  const pathname = usePathname();

  // Esconde no link público do síndico (sem login) — app chrome é só do produtor.
  if (pathname.startsWith("/r/")) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <Building2 className="size-4 text-muted-foreground" strokeWidth={2} />
          ElevaLaudo
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label, Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
