import { redirect } from "next/navigation";
import { KeyRound, Plus, Users } from "lucide-react";

import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import {
  getAdminsDoEngenheiro,
  getConvitesPendentes,
} from "@/lib/conexoes-db";
import { CodigoConexao } from "./codigo-conexao";
import { gerarCodigo } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConexoesPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  if (!isEngenheiro(sessao.user.role)) redirect("/laudos");

  const [pendentes, admins] = await Promise.all([
    getConvitesPendentes(sessao.user.id),
    getAdminsDoEngenheiro(sessao.user.id),
  ]);
  const atual = pendentes[0] ?? null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Conexão com a administração
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          Gere um código e envie para a administração (síndico/administradora).
          Ao conectar, ela passa a ver — só para leitura — todos os laudos que
          você publica.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound className="size-4 text-brand-green-strong" strokeWidth={2.25} />
          Código de conexão
        </h2>
        {atual ? (
          <CodigoConexao codigo={atual.codigo} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum código ativo. Gere um para compartilhar.
          </p>
        )}
        <form action={gerarCodigo}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Plus className="size-4" strokeWidth={2.25} />
            {atual ? "Gerar novo código" : "Gerar código"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground">
          Cada código vincula uma administração. Gere um novo para cada
          parceiro — gerar um novo não desconecta quem já está vinculado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4 text-brand-green-strong" strokeWidth={2.25} />
          Administrações conectadas
          <span className="text-xs font-normal text-muted-foreground">
            {admins.length}
          </span>
        </h2>
        {admins.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhuma administração conectada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {admins.map((a) => (
              <li
                key={a.email}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-green/30 text-xs font-semibold uppercase">
                  {a.nome.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {a.nome}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.email}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
