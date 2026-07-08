import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  FileText,
  FileUp,
  GitCompareArrows,
  HardHat,
  MessageSquareText,
  OctagonAlert,
  ScanText,
  ShieldCheck,
  Signature,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSessao } from "@/lib/auth/session";

export const metadata = {
  title: "ElevaLaudo — o laudo de elevador que o síndico entende sozinho",
  description:
    "Envie o PDF da inspeção de elevador. A IA estrutura os dados e escreve um resumo em português claro; o engenheiro revisa, assina e publica. Comunica, nunca auto-certifica.",
};

/**
 * Landing pública (marketing). É a porta de entrada do site, FORA do grupo
 * autenticado `(app)` — por isso não herda a lateral. Quem já tem sessão cai
 * direto no painel (defesa em profundidade; o middleware deixa "/" passar).
 *
 * Discurso liability-safe (ADR-002): o produto COMUNICA o que o laudo diz e o
 * engenheiro assina — nunca auto-certifica segurança. BR-native é o moat
 * (NBR 16858, RIA, PT de gente), então a página fala essa língua.
 */
export default async function LandingPage() {
  const sessao = await getSessao();
  if (sessao) redirect("/laudos");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <DemoExtracao />
        <ComoFunciona />
        <ParaQuem />
        <Recursos />
        <CtaFinal />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------------------------------------- header --- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/35"
          aria-label="ElevaLaudo — início"
        >
          <Logo markClassName="size-8" wordClassName="hidden text-lg sm:block" />
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex">
          <a
            href="#como-funciona"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground"
          >
            Como funciona
          </a>
          <a
            href="#para-quem"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground"
          >
            Para quem
          </a>
          <a
            href="#recursos"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground"
          >
            Recursos
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/35 sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[color-mix(in_oklch,var(--primary),black_12%)] active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Criar conta
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ hero --- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* brilho de marca, sutil — dá um "momento" sem virar enfeite */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--brand-green),transparent_68%),transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* coluna de texto */}
        <div className="min-w-0 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-brand-green-strong" strokeWidth={2.25} />
            Laudo de elevador em português de gente
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            O laudo técnico vira um painel que o síndico entende{" "}
            <span className="text-brand-green-strong">sozinho</span>.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Envie o PDF da inspeção. A IA estrutura os dados e escreve um resumo
            claro. O engenheiro revisa, assina e publica — você nunca
            auto-certifica nada.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[color-mix(in_oklch,var(--primary),black_12%)] active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <FileUp className="size-4" strokeWidth={2.25} />
              Criar conta grátis
            </Link>
            <a
              href="#demo-extracao"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring/35"
            >
              Ver demo sem conta
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </a>
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-brand-green-strong" strokeWidth={2.25} />
            Conforme NBR 16858 · Acompanha a RIA municipal · Revisão humana antes
            de publicar
          </p>
        </div>

        {/* preview do dashboard — espelha o produto (semáforo RAG) */}
        <DashboardPreview />
      </div>
    </section>
  );
}

/** Mockup estático do painel — usa o mesmo vocabulário de cor do produto. */
function DashboardPreview() {
  return (
    <div className="relative min-w-0">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(50%_50%_at_70%_30%,color-mix(in_oklch,var(--brand-green),transparent_82%),transparent)]"
      />
      <div className="surface-panel relative rounded-3xl p-4 sm:p-5">
        {/* barra superior */}
        <div className="flex min-w-0 items-center gap-2 pb-3">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
            elevalaudo.app/laudos/edificio-horizonte-azul
          </span>
        </div>

        {/* hero do status (mock) */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-amber-400 opacity-15 blur-3xl"
          />
          <div className="relative flex items-center gap-4">
            {/* semáforo */}
            <div className="flex shrink-0 flex-col gap-2 rounded-2xl bg-zinc-900 p-2.5 shadow-lg ring-1 ring-inset ring-white/10">
              <span className="size-6 rounded-full bg-emerald-500/15" />
              <span className="size-6 rounded-full bg-amber-400 shadow-[0_0_18px_4px_rgba(251,191,36,0.55)]" />
              <span className="size-6 rounded-full bg-red-500/15" />
            </div>
            <div className="min-w-0">
              <p className="text-kicker">Status do laudo</p>
              <div className="mt-1 flex items-center gap-2">
                <TriangleAlert className="size-6 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                <span className="text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                  Atenção
                </span>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Há não-conformidades a corrigir dentro do prazo.
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {[
            { v: "3", l: "Equipamentos" },
            { v: "7", l: "Não-conformidades" },
            { v: "2", l: "Urgentes" },
          ].map((k) => (
            <div
              key={k.l}
              className="rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <p className="text-xl font-semibold tracking-tight tabular-nums">
                {k.v}
              </p>
              <p className="text-[0.7rem] leading-tight text-muted-foreground">
                {k.l}
              </p>
            </div>
          ))}
        </div>

        {/* lista de NCs (mock) */}
        <div className="mt-3 space-y-2">
          <PreviewNc
            sev="urgente"
            texto="Cabo de tração com desgaste acima do limite"
          />
          <PreviewNc
            sev="atencao"
            texto="Iluminação de emergência da cabine intermitente"
          />
          <PreviewNc sev="leve" texto="Sinalização de capacidade desbotada" />
        </div>
      </div>
    </div>
  );
}

function PreviewNc({
  sev,
  texto,
}: {
  sev: "urgente" | "atencao" | "leve";
  texto: string;
}) {
  const cfg = {
    urgente: {
      Icon: OctagonAlert,
      cls: "text-red-700 dark:text-red-400",
      pill: "bg-red-500/10 ring-red-500/25",
    },
    atencao: {
      Icon: TriangleAlert,
      cls: "text-amber-700 dark:text-amber-400",
      pill: "bg-amber-400/10 ring-amber-500/25",
    },
    leve: {
      Icon: ShieldCheck,
      cls: "text-zinc-600 dark:text-zinc-400",
      pill: "bg-zinc-500/10 ring-zinc-500/20",
    },
  }[sev];

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2">
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${cfg.pill}`}
      >
        <cfg.Icon className={`size-4 ${cfg.cls}`} strokeWidth={2.25} />
      </span>
      <span className="truncate text-sm text-foreground/80">{texto}</span>
    </div>
  );
}

/* ------------------------------------------------------------ trust strip --- */

function TrustStrip() {
  const itens = [
    { Icon: ShieldCheck, label: "Conforme NBR 16858" },
    { Icon: CalendarClock, label: "Acompanha a RIA municipal" },
    { Icon: Signature, label: "Assinatura do responsável técnico" },
    { Icon: FileText, label: "Comunica, nunca auto-certifica" },
  ];
  return (
    <section className="border-y border-border bg-secondary/50">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden px-5 py-2 sm:px-8 lg:grid-cols-4">
        {itens.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-center gap-2 px-3 py-3 text-center text-xs font-medium text-muted-foreground sm:text-sm"
          >
            <it.Icon className="size-4 shrink-0 text-brand-green-strong" strokeWidth={2.25} />
            {it.label}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- demo extracao --- */

function DemoExtracao() {
  const passos = [
    "Upload do PDF",
    "Extração estruturada",
    "Revisão humana",
    "Dashboard publicado",
  ];

  return (
    <Section
      id="demo-extracao"
      kicker="Demo sem conta"
      titulo="Veja o fluxo inteiro antes de criar conta"
      sub="Uma simulação fiel do produto: o PDF entra, a IA organiza, o engenheiro revisa e o síndico recebe um painel legível."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-panel flex flex-col gap-6 rounded-3xl p-6 sm:p-7">
          <div>
            <p className="text-sm leading-7 text-muted-foreground">
              A demo abaixo espelha o fluxo real do ElevaLaudo sem pedir login.
              Ela mostra o que acontece depois do envio do laudo, inclusive o
              ponto de revisão obrigatória antes de qualquer publicação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {passos.map((passo, index) => (
              <div
                key={passo}
                className="flex items-center gap-2"
              >
                <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80">
                  {passo}
                </span>
                {index < passos.length - 1 ? (
                  <ArrowRight
                    className="size-3.5 text-muted-foreground"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-brand-cream-soft/70 p-4">
            <p className="text-sm font-semibold tracking-tight">
              O que esta demo deixa claro
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              O produto comunica o laudo em português de gente, mas a
              publicação continua dependendo da revisão e da assinatura do
              responsável técnico.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div
            className="demo-card-enter surface-panel rounded-3xl p-5"
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-kicker">01 · Upload</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  PDF recebido
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-green/15 text-brand-green-strong ring-1 ring-brand-green-strong/15">
                <FileUp className="size-5" strokeWidth={2.25} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background/80 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-brand-green-strong">
                  <FileText className="size-4.5" strokeWidth={2.1} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground/80">
                    laudo-inspecao.pdf
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Arquivo validado e pronto para leitura
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {["PDF conferido", "Blob privado", "Status: extraindo"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="size-2 rounded-full bg-brand-green-strong" />
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div
            className="demo-card-enter surface-panel relative overflow-hidden rounded-3xl p-5"
            style={{ animationDelay: "120ms" }}
          >
            <div
              aria-hidden
              className="extraction-scan absolute inset-x-8 top-16 h-px bg-gradient-to-r from-transparent via-brand-green-strong/70 to-transparent"
            />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-kicker">02 · Extração</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  IA estrutura o laudo
                </h3>
              </div>
              <span className="relative flex size-11 items-center justify-center rounded-2xl bg-brand-green/15 text-brand-green-strong ring-1 ring-brand-green-strong/15">
                <span
                  aria-hidden
                  className="extraction-halo absolute inset-[-0.55rem] rounded-[1.25rem] bg-brand-green/20 blur-lg"
                />
                <ScanText
                  className="extraction-logo-pulse relative size-5"
                  strokeWidth={2.25}
                />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Lendo o PDF",
                "Separando equipamentos",
                "Classificando severidades",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-border bg-background/80 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground/85">
                      {step}
                    </span>
                    <span
                      className="extraction-step-dot size-2.5 shrink-0 rounded-full bg-brand-green-strong"
                      style={{ animationDelay: `${index * 180}ms` }}
                      aria-hidden
                    />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="demo-progress-fill h-full rounded-full bg-brand-green-strong"
                      style={{ animationDelay: `${index * 220}ms` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="demo-card-enter surface-panel rounded-3xl p-5"
            style={{ animationDelay: "240ms" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-kicker">03 · Revisão</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  Engenheiro confere e assina
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
                <Signature className="size-5" strokeWidth={2.25} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-tight">
                    Responsável técnico
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Helena Costa · CREA 123456/D
                  </p>
                </div>
                <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
                  Revisando
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  "Confere o PDF original",
                  "Ajusta dados antes de publicar",
                  "Assina antes do link público",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <ShieldCheck
                      className="size-4 shrink-0 text-brand-green-strong"
                      strokeWidth={2.25}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="demo-card-enter surface-panel rounded-3xl p-5"
            style={{ animationDelay: "360ms" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-kicker">04 · Dashboard</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  Painel pronto para o síndico
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                Publicado
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 flex-col gap-2 rounded-2xl bg-zinc-900 p-2.5 ring-1 ring-inset ring-white/10">
                  <span className="size-5 rounded-full bg-emerald-500/15" />
                  <span className="status-lamp-on size-5 rounded-full bg-amber-400 shadow-[0_0_16px_4px_rgba(251,191,36,0.5)]" />
                  <span className="size-5 rounded-full bg-red-500/15" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TriangleAlert
                      className="size-5 text-amber-600 dark:text-amber-400"
                      strokeWidth={2.1}
                    />
                    <span className="text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                      Atenção
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Resumo claro, prazos visíveis e pendências ordenadas por
                    urgência.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { value: "3", label: "Equipamentos" },
                  { value: "7", label: "NCs" },
                  { value: "2", label: "Urgentes" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border bg-card px-2.5 py-2 text-center"
                  >
                    <p className="text-lg font-semibold tracking-tight">
                      {item.value}
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <PreviewNc
                  sev="urgente"
                  texto="Cabo de tração com desgaste acima do limite"
                />
                <PreviewNc
                  sev="atencao"
                  texto="Iluminação de emergência da cabine intermitente"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------- como funciona --- */

function ComoFunciona() {
  const passos = [
    {
      Icon: FileUp,
      n: "01",
      titulo: "Envie o PDF",
      desc: "Solte o laudo de inspeção. Texto nativo ou escaneado — a gente lê os dois.",
    },
    {
      Icon: ScanText,
      n: "02",
      titulo: "A IA estrutura",
      desc: "Extrai equipamentos, não-conformidades e prazos num objeto validado e escreve o resumo em português claro.",
    },
    {
      Icon: Signature,
      n: "03",
      titulo: "Engenheiro revisa e publica",
      desc: "O responsável técnico confere, ajusta e assina. Só então o síndico recebe o painel.",
    },
  ];
  return (
    <Section
      id="como-funciona"
      kicker="Como funciona"
      titulo="Do PDF ao painel em três passos"
      sub="A IA faz o trabalho braçal; a responsabilidade técnica continua sendo de quem assina."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {passos.map((p, i) => (
          <div
            key={p.n}
            className="surface-panel relative flex flex-col gap-3 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-green/20 text-brand-green-strong ring-1 ring-brand-green-strong/15">
                <p.Icon className="size-5" strokeWidth={2.25} />
              </span>
              <span className="font-mono text-sm font-semibold text-muted-foreground/60">
                {p.n}
              </span>
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{p.titulo}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{p.desc}</p>
            {i < passos.length - 1 ? (
              <ArrowRight
                className="absolute top-1/2 -right-3 z-10 hidden size-6 -translate-y-1/2 rounded-full bg-background p-1 text-muted-foreground md:block"
                strokeWidth={2}
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- para quem --- */

function ParaQuem() {
  return (
    <Section
      id="para-quem"
      kicker="Para quem"
      titulo="Dois papéis, uma fonte da verdade"
      sub="Cada um vê o que precisa — sem ruído e sem virar técnico de elevador."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <RoleCard
          Icon={HardHat}
          titulo="Engenheiro"
          desc="Extrai, revisa, assina e publica. Sua marca no PDF e o controle do que vira oficial."
          itens={[
            "Rascunho gerado pela IA, pronto pra revisar",
            "Edição e assinatura antes de publicar",
            "Branding próprio no laudo exportado",
            "Conexão com os clientes por código",
          ]}
          destaque
        />
        <RoleCard
          Icon={Building2}
          titulo="Administração"
          desc="Síndico ou administradora: recebe o painel pronto, acompanha histórico e prazos."
          itens={[
            "Status em semáforo, legível em 2 segundos",
            "Resumo em português, sem jargão técnico",
            "Histórico por prédio ao longo dos anos",
            "Alertas dos prazos da RIA",
          ]}
        />
      </div>
    </Section>
  );
}

function RoleCard({
  Icon,
  titulo,
  desc,
  itens,
  destaque = false,
}: {
  Icon: typeof HardHat;
  titulo: string;
  desc: string;
  itens: string[];
  destaque?: boolean;
}) {
  return (
    <div
      className={`surface-panel flex flex-col gap-5 rounded-2xl p-6 sm:p-7 ${
        destaque ? "border-brand-green-strong/30 bg-brand-green/[0.07]" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-green/20 text-brand-green-strong ring-1 ring-brand-green-strong/15">
          <Icon className="size-6" strokeWidth={2} />
        </span>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{titulo}</h3>
        </div>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
      <ul className="flex flex-col gap-2.5">
        {itens.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-sm">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-brand-green-strong"
              strokeWidth={2.25}
            />
            <span className="text-foreground/85">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------------- recursos --- */

function Recursos() {
  const recursos = [
    {
      Icon: TriangleAlert,
      titulo: "Semáforo glanceable",
      desc: "Seguro, Atenção ou Urgente. O estado do laudo em uma olhada, sem legenda.",
    },
    {
      Icon: OctagonAlert,
      titulo: "Não-conformidades rankeadas",
      desc: "Cada pendência por severidade, com prazo e o que fazer — sem caça ao tesouro no PDF.",
    },
    {
      Icon: GitCompareArrows,
      titulo: "Histórico por prédio",
      desc: "Compare inspeções ano a ano e veja o prédio melhorar (ou piorar) no tempo.",
    },
    {
      Icon: CalendarClock,
      titulo: "Alertas da RIA",
      desc: "Os prazos municipais acompanhados pra ninguém ser pego de surpresa por multa.",
    },
    {
      Icon: FileText,
      titulo: "PDF branded",
      desc: "Exportação self-contained com a marca do engenheiro, pronta pra enviar.",
    },
    {
      Icon: MessageSquareText,
      titulo: "Converse com o laudo",
      desc: "Pergunte em português e receba a resposta ancorada no que o laudo diz.",
    },
  ];
  return (
    <Section
      id="recursos"
      kicker="Recursos"
      titulo="Tudo que o laudo precisa virar, num lugar só"
      sub="Construído BR-native: NBR 16858, RIA e linguagem que o cliente final entende."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recursos.map((r) => (
          <div
            key={r.titulo}
            className="group surface-panel flex flex-col gap-3 rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:border-brand-green-strong/40 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-brand-green-strong ring-1 ring-border transition-colors group-hover:bg-brand-green/15">
              <r.Icon className="size-5" strokeWidth={2.25} />
            </span>
            <h3 className="font-semibold tracking-tight">{r.titulo}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- cta final --- */

function CtaFinal() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="surface-panel relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand-green opacity-20 blur-3xl"
        />
        <span className="relative inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          <Sparkles className="size-3.5 text-brand-green-strong" strokeWidth={2.25} />
          Comece pelo próximo laudo
        </span>
        <h2 className="relative max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Transforme o próximo laudo num painel que se explica sozinho.
        </h2>
        <p className="relative max-w-xl text-base leading-7 text-muted-foreground">
          Crie sua conta, envie um PDF e veja a inspeção virar dashboard em
          minutos. O engenheiro revisa e assina antes de qualquer publicação.
        </p>
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <Link
            href="/cadastro"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[color-mix(in_oklch,var(--primary),black_12%)] active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <FileUp className="size-4" strokeWidth={2.25} />
            Criar conta grátis
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer --- */

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-2">
          <Logo markClassName="size-7" wordClassName="text-base" />
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            Camada de comunicação do laudo de inspeção de elevador. O engenheiro
            revisa e assina; o produto nunca auto-certifica segurança.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="font-medium text-foreground transition-colors hover:text-brand-green-strong"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------------- helpers --- */

function Section({
  id,
  kicker,
  titulo,
  sub,
  children,
}: {
  id?: string;
  kicker: string;
  titulo: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-kicker">{kicker}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {titulo}
          </h2>
          {sub ? (
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              {sub}
            </p>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
