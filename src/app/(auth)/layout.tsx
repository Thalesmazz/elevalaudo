import Link from "next/link";
import { CalendarClock, ShieldCheck, Signature } from "lucide-react";

import { Logo, LogoMark } from "@/components/logo";

/**
 * Layout das telas de auth (login/cadastro): split-screen. À esquerda, um painel
 * de marca (verde) com o "momento" do produto — o semáforo RAG e os sinais de
 * confiança (NBR/RIA/assinatura). À direita, o formulário, centrado e calmo.
 * No mobile o painel some e fica só a marca + form. É a porta de entrada, antes
 * de existir sessão — sem sidebar nem nav.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      {/* Painel de marca (só desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-100 lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 size-96 rounded-full bg-brand-green opacity-20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklch,white,transparent_94%)_1px,transparent_1px),linear-gradient(180deg,color-mix(in_oklch,white,transparent_94%)_1px,transparent_1px)] bg-[size:44px_44px]"
        />

        <Link
          href="/"
          className="relative inline-flex w-fit rounded-xl focus-visible:ring-3 focus-visible:ring-brand-green/50"
        >
          {/* Wordmark em tom claro p/ contraste no painel escuro */}
          <span className="inline-flex items-center gap-2.5">
            <LogoMark className="size-9" />
            <span className="text-2xl font-semibold tracking-tight">
              <span className="text-white">Eleva</span>
              <span className="text-brand-green">Laudo</span>
            </span>
          </span>
        </Link>

        <div className="relative max-w-md space-y-8">
          <p className="text-2xl font-semibold leading-9 tracking-tight text-balance text-white">
            O laudo técnico vira um painel que o síndico entende sozinho.
          </p>

          {/* mini-semáforo: o vocabulário visual do produto */}
          <div className="flex items-center gap-4">
            <div className="flex shrink-0 flex-col gap-2 rounded-2xl bg-zinc-900 p-2.5 ring-1 ring-inset ring-white/10">
              <span className="size-5 rounded-full bg-emerald-500 shadow-[0_0_16px_3px_rgba(16,185,129,0.55)]" />
              <span className="size-5 rounded-full bg-amber-400/20" />
              <span className="size-5 rounded-full bg-red-500/20" />
            </div>
            <div className="text-sm text-zinc-400">
              <p className="font-medium text-emerald-400">Seguro</p>
              <p>Status legível em 2 segundos, sem jargão.</p>
            </div>
          </div>

          <ul className="space-y-3 text-sm text-zinc-300">
            {[
              { Icon: ShieldCheck, t: "Conforme NBR 16858" },
              { Icon: CalendarClock, t: "Acompanha a RIA municipal" },
              { Icon: Signature, t: "Revisão e assinatura do responsável técnico" },
            ].map((it) => (
              <li key={it.t} className="flex items-center gap-3">
                <it.Icon className="size-4 shrink-0 text-brand-green" strokeWidth={2.25} />
                {it.t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs leading-5 text-zinc-500">
          Camada de comunicação do laudo. O engenheiro revisa e assina; o produto
          nunca auto-certifica segurança.
        </p>
      </aside>

      {/* Lado do formulário */}
      <section className="relative flex flex-col items-center justify-center gap-8 px-6 py-12">
        {/* brilho de marca no mobile (some no desktop, onde o painel cobre isso) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--brand-green),transparent_80%),transparent)] lg:hidden"
        />

        <Link
          href="/"
          className="relative rounded-xl focus-visible:ring-3 focus-visible:ring-ring/35 lg:hidden"
        >
          <Logo markClassName="size-12 drop-shadow-sm" wordClassName="text-2xl" />
        </Link>

        {children}
      </section>
    </main>
  );
}
