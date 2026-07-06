"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Ações compactas do link público (P4, ADR-006): em vez de expor a URL crua
 * (texto truncado ocupando espaço), copia pra área de transferência com
 * feedback rápido — o síndico raramente digita o link, só recebe por
 * WhatsApp/copia uma vez.
 */
export function ShareLinkActions({
  shareUrl,
  pdfUrl,
}: {
  shareUrl: string;
  pdfUrl: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      const absoluto =
        typeof window !== "undefined"
          ? `${window.location.origin}${shareUrl}`
          : shareUrl;
      await navigator.clipboard.writeText(absoluto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // clipboard indisponível — usuário copia manualmente pela URL
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copiar}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
          copiado
            ? "border-brand-green-strong/30 bg-brand-green/15 text-brand-green-strong"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {copiado ? (
          <Check className="size-3.5" strokeWidth={2.5} />
        ) : (
          <Copy className="size-3.5" strokeWidth={2} />
        )}
        {copiado ? "Link copiado" : "Copiar link do síndico"}
      </button>
      <a
        href={pdfUrl}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Download className="size-3.5" strokeWidth={2} />
        Baixar PDF branded
      </a>
    </>
  );
}
