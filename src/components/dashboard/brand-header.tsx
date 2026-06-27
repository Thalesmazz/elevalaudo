import type { Branding } from "@/lib/branding";

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
  const { nome, logoSrc, corPrimaria } = branding;
  if (!logoSrc && !nome) return null;

  return (
    <header
      style={corPrimaria ? { ["--brand" as string]: corPrimaria } : undefined}
      className="flex items-center justify-between gap-4 border-b border-border pb-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt={nome ?? "Logo do produtor"}
            className="h-9 w-auto max-w-[180px] object-contain"
          />
        ) : (
          <span
            className="truncate text-lg font-semibold tracking-tight"
            style={corPrimaria ? { color: "var(--brand)" } : undefined}
          >
            {nome}
          </span>
        )}
        {logoSrc && nome ? (
          <span className="truncate text-sm text-muted-foreground">{nome}</span>
        ) : null}
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        via <span className="font-medium text-foreground/70">ElevaLaudo</span>
      </span>
    </header>
  );
}
