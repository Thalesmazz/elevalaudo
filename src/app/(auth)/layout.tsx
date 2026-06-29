import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

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

      <Link
        href="/"
        className="relative flex items-center gap-2.5 tracking-tight"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-green text-zinc-900 shadow-sm ring-1 ring-inset ring-brand-green-strong/30">
          <ClipboardCheck className="size-5" strokeWidth={2.25} />
        </span>
        <span className="text-lg font-semibold">ElevaLaudo</span>
      </Link>

      {children}
    </main>
  );
}
