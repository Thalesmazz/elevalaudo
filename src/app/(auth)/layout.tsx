import Link from "next/link";

import { Logo } from "@/components/logo";

/**
 * Layout das telas de auth (login/cadastro): centrado, sem sidebar nem nav —
 * é a porta de entrada, antes de existir sessão. Brand mark verde (ecoa o logo:
 * clipboard/laudo) + brilho de marca sutil no fundo. O formulário fica num card.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-6 py-12">
      {/* Brilho de marca (verde, sutil) — dá um "momento" sem virar enfeite. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-brand-green/20 opacity-70 blur-3xl"
      />

      <Link href="/" className="relative">
        <Logo markClassName="size-9 drop-shadow-sm" wordClassName="text-lg" />
      </Link>

      {children}
    </main>
  );
}
