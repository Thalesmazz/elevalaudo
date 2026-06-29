import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getOrCreateProducer } from "@/lib/branding";
import { normalizeHexColor } from "@/lib/branding";
import { getSessao } from "@/lib/auth/session";
import { isEngenheiro } from "@/lib/auth/roles";
import { BrandingForm } from "./branding-form";

// Configuração de branding do produtor (P4 `producer-branding`). Só o engenheiro
// (parte técnica) configura a marca — a administração não tem branding próprio.
export const dynamic = "force-dynamic";

export default async function ProdutorPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  if (!isEngenheiro(sessao.user.role)) redirect("/laudos");

  const producer = await getOrCreateProducer();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="space-y-2">
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Marca da sua consultoria
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Sua logo e cor aparecem no dashboard, no link que você manda pro
          síndico e no PDF — o laudo fica com a sua cara, não com a do
          ElevaLaudo.
        </p>
      </div>

      <BrandingForm
        nome={producer.nome ?? ""}
        email={producer.email ?? ""}
        corPrimaria={normalizeHexColor(producer.corPrimaria) ?? ""}
        logoSrc={
          producer.logoPathname
            ? `/branding/logo?v=${producer.updatedAt.getTime()}`
            : null
        }
      />
    </main>
  );
}
