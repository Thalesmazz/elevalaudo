import type { Branding } from "@/lib/branding";
import { Logo } from "@/components/logo";

/**
 * Cabeçalho white-label (P4 `producer-branding`): a logo/nome do produtor no
 * topo do dashboard e do link público, com a cor da marca num filete de acento.
 * Se o produtor não configurou nada, não renderiza — o layout default fica igual.
 *
 * Liability/honestidade: a marca é do produtor, mas o "via ElevaLaudo" continua
 * visível (o produto comunica de quem é a ferramenta) e o semáforo RAG nunca
 * herda a cor da marca.
 */
export function BrandHeader({ branding }: { branding: Branding }) {
  const { nome, corPrimaria } = branding;
  if (!nome) return null;

  return (
    <header
      style={corPrimaria ? { ["--brand" as string]: corPrimaria } : undefined}
      className="flex items-center justify-between gap-4 border-b border-border pb-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="truncate text-lg font-semibold tracking-tight"
          style={corPrimaria ? { color: "var(--brand)" } : undefined}
        >
          {nome}
        </span>
      </div>

      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        via
        <Logo markClassName="size-5" wordClassName="text-sm" />
      </span>
    </header>
  );
}
