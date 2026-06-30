import Link from "next/link";
import {
  CalendarClock,
  FileUp,
  ScanText,
  ShieldCheck,
  Signature,
} from "lucide-react";

import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Layout das telas de auth (login/cadastro): split-screen. À esquerda, um painel
 * de marca (sempre escuro) que EXPLICA o produto — o que ele faz e o fluxo em
 * três passos (PDF -> IA estrutura -> engenheiro assina) com os selos de
 * confiança. À direita, o formulário, com o toggle de tema no topo. No mobile o
 * painel some e fica só a marca + form. É a porta de entrada, antes da sessão.
 */

const PASSOS = [
  {
    Icon: FileUp,
    titulo: "Envie o PDF da inspeção",
    desc: "Texto nativo ou escaneado, sem formatar nada.",
  },
  {
    Icon: ScanText,
    titulo: "A IA estrutura e resume",
    desc: "Equipamentos, não-conformidades e prazos em português claro.",
  },
  {
    Icon: Signature,
    titulo: "Engenheiro revisa e assina",
    desc: "Só então o síndico recebe o painel publicado.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      {/* Painel de marca explicativo (só desktop) */}
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
          <span className="inline-flex items-center gap-2.5">
            <LogoMark className="size-9" />
            <span className="text-2xl font-semibold tracking-tight">
              <span className="text-white">Eleva</span>
              <span className="text-brand-green">Laudo</span>
            </span>
          </span>
        </Link>

        <div className="relative max-w-md space-y-9">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance text-white">
              O laudo do elevador, traduzido para quem decide.
            </h2>
            <p className="text-base leading-7 text-zinc-400">
              O ElevaLaudo transforma o PDF técnico da inspeção num painel e num
              resumo que o síndico entende sozinho. A IA prepara; o engenheiro
              assina.
            </p>
          </div>

          {/* Fluxo em 3 passos: explica o produto de relance */}
          <ol className="space-y-5">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="relative flex flex-col items-center">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-green ring-1 ring-white/10">
                    <p.Icon className="size-5" strokeWidth={2} />
                  </span>
                  {i < PASSOS.length - 1 ? (
                    <span className="mt-1 h-6 w-px bg-white/10" aria-hidden />
                  ) : null}
                </span>
                <div className="pt-1">
                  <p className="font-medium text-zinc-100">{p.titulo}</p>
                  <p className="text-sm leading-6 text-zinc-400">{p.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-400">
            {[
              { Icon: ShieldCheck, t: "NBR 16858" },
              { Icon: CalendarClock, t: "Prazos da RIA" },
              { Icon: Signature, t: "Assinatura do RT" },
            ].map((it) => (
              <li key={it.t} className="inline-flex items-center gap-1.5">
                <it.Icon className="size-3.5 text-brand-green" strokeWidth={2.25} />
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

        {/* Toggle de tema, topo direito */}
        <div className="absolute top-5 right-5 z-10">
          <ThemeToggle />
        </div>

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
