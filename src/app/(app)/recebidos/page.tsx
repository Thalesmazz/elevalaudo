import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Inbox, Link2, Users } from "lucide-react";

import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { getEngenheirosDoAdmin, getLaudosRecebidos } from "@/lib/conexoes-db";
import { statusConfig } from "@/lib/status";
import { ConnectForm } from "./connect-form";

export const dynamic = "force-dynamic";

export default async function RecebidosPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  // Recebidos é a visão da administração. O engenheiro gerencia em /conexoes.
  if (isEngenheiro(sessao.user.role)) redirect("/conexoes");

  const [engenheiros, laudos] = await Promise.all([
    getEngenheirosDoAdmin(sessao.user.id),
    getLaudosRecebidos(sessao.user.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Recebidos</h1>
        <p className="text-sm text-muted-foreground">
          Laudos publicados pelos engenheiros conectados a você.
        </p>
      </div>

      {/* Conectar a um engenheiro por código */}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="size-4 text-brand-green-strong" strokeWidth={2.25} />
          Conectar a um engenheiro
        </h2>
        <p className="text-sm text-muted-foreground">
          Cole o código que o engenheiro te enviou para acompanhar os laudos
          dele.
        </p>
        <ConnectForm />
        {engenheiros.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Users className="size-4 text-muted-foreground" strokeWidth={2} />
            <span className="text-xs text-muted-foreground">Conectado a:</span>
            {engenheiros.map((e) => (
              <span
                key={e.email}
                className="rounded-full bg-brand-green/25 px-2.5 py-0.5 text-xs font-medium"
              >
                {e.nome}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Laudos recebidos */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Inbox className="size-4 text-brand-green-strong" strokeWidth={2.25} />
          Laudos disponíveis
          <span className="text-xs font-normal text-muted-foreground">
            {laudos.length}
          </span>
        </h2>

        {laudos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-brand-cream-soft py-12 text-center">
            <Inbox className="size-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {engenheiros.length === 0
                ? "Conecte-se a um engenheiro para ver os laudos publicados."
                : "Nenhum laudo publicado pelos engenheiros conectados ainda."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {laudos.map((l) => {
              const ragCfg = l.statusGeral ? statusConfig[l.statusGeral] : null;
              return (
                <li key={l.id}>
                  <Link
                    href={`/laudos/${l.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand-green-strong/40"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {ragCfg ? (
                          <span
                            className={cnAccent(ragCfg.accent)}
                          >
                            <ragCfg.Icon className="size-3.5" strokeWidth={2.25} />
                            {ragCfg.label}
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          por {l.engenheiroNome}
                        </span>
                      </div>
                      <p className="truncate text-sm font-medium text-foreground">
                        {l.titulo}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.dataInspecao ? `Inspeção ${l.dataInspecao} · ` : ""}
                        {l.totalNc}{" "}
                        {l.totalNc === 1 ? "não-conformidade" : "não-conformidades"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function cnAccent(accent: string) {
  return `inline-flex items-center gap-1.5 text-xs font-medium ${accent}`;
}
