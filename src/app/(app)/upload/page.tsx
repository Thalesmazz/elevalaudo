import Link from "next/link";
import { redirect } from "next/navigation";
import { Palette } from "lucide-react";

import { getSessao } from "@/lib/auth/session";
import { getEmpresasSimples } from "@/lib/empresas-db";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  const { empresaId } = await searchParams;
  const empresas = await getEmpresasSimples(sessao.user.id);
  const empresaInicialId = empresas.some((e) => e.id === empresaId)
    ? empresaId
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nova extração
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Suba o PDF do laudo de inspeção. Vamos extrair os dados e montar o
          dashboard em português de gente. Você revisa antes de publicar.
        </p>
      </div>

      <UploadForm empresas={empresas} empresaInicialId={empresaInicialId} />

      <Link
        href="/produtor"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Palette className="size-4" />
        Personalizar a marca da sua consultoria
      </Link>
    </main>
  );
}
