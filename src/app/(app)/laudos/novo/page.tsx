import { redirect } from "next/navigation";

import { getSessao } from "@/lib/auth/session";
import { podeEditarLaudo } from "@/lib/auth/roles";
import { getEmpresasSimples } from "@/lib/empresas-db";
import { NovoLaudoForm } from "./novo-laudo-form";

export const dynamic = "force-dynamic";

export default async function NovoLaudoPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  // Montar laudo do zero é trabalho do responsável técnico (liability,
  // ADR-002) — mesma regra que já rege revisar/publicar.
  if (!podeEditarLaudo(sessao.user.role)) redirect("/laudos");

  const { empresaId } = await searchParams;
  const empresas = await getEmpresasSimples(sessao.user.id);
  const empresaInicialId = empresas.some((e) => e.id === empresaId)
    ? empresaId
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-5 py-10 sm:px-8 sm:py-16">
      <div className="space-y-2 border-b border-border pb-6">
        <p className="text-kicker">Entrada de documento</p>
        <h1 className="text-3xl font-semibold tracking-tight">Novo laudo</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground text-pretty">
          Sem o PDF em mãos? Monte o laudo direto na tela. Escolha a empresa
          pra começar — os dados ficam salvos como rascunho até você assinar.
        </p>
      </div>

      <div className="surface-panel rounded-2xl p-5 sm:p-6">
        <NovoLaudoForm empresas={empresas} empresaInicialId={empresaInicialId} />
      </div>
    </main>
  );
}
