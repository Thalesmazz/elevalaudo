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
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--brand-green),transparent_74%),transparent)]"
      />

      <Link href="/" className="relative rounded-xl focus-visible:ring-3 focus-visible:ring-ring/35">
        <Logo markClassName="size-14 drop-shadow-sm" wordClassName="text-3xl" />
      </Link>

      {children}
    </main>
  );
}
