import Link from "next/link";
import { redirect } from "next/navigation";
import { FilePen, Palette } from "lucide-react";

import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { getEmpresasSimples } from "@/lib/empresas-db";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";
// Teto do plano Hobby. A extração (after() na action de upload) roda dentro da
// vida desta function — haiku + retry sonnet num PDF grande precisa da folga.
export const maxDuration = 60;

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  const engenheiro = isEngenheiro(sessao.user.role);

  const { empresaId } = await searchParams;
  const empresas = await getEmpresasSimples(sessao.user.id);
  const empresaInicialId = empresas.some((e) => e.id === empresaId)
    ? empresaId
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-5 py-10 sm:px-8 sm:py-16">
      <div className="space-y-2 border-b border-border pb-6">
        <p className="text-kicker">Entrada de documento</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Nova extração
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground text-pretty">
          Suba o PDF do laudo de inspeção. Vamos extrair os dados e montar o
          dashboard em português de gente. Você revisa antes de publicar.
        </p>
      </div>

      <div className="surface-panel rounded-2xl p-5 transition-shadow focus-within:ring-3 focus-within:ring-ring/35 sm:p-6">
        <UploadForm empresas={empresas} empresaInicialId={empresaInicialId} />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {engenheiro ? (
          <Link
            href="/laudos/novo"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/35"
          >
            <FilePen className="size-4" />
            Não tem o PDF? Monte o laudo manualmente
          </Link>
        ) : null}
        <Link
          href="/produtor"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <Palette className="size-4" />
          Personalizar a marca da sua consultoria
        </Link>
      </div>
    </main>
  );
}
