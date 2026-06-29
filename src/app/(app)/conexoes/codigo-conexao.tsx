"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/** Mostra o código de conexão com botão de copiar. */
export function CodigoConexao({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // clipboard indisponível — usuário copia manualmente
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-brand-cream-soft p-3">
      <code className="flex-1 truncate font-mono text-lg font-semibold tracking-wider">
        {codigo}
      </code>
      <button
        type="button"
        onClick={copiar}
        aria-label="Copiar código"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
          copiado
            ? "bg-brand-green text-primary-foreground"
            : "bg-card text-foreground hover:bg-muted",
        )}
      >
        {copiado ? (
          <Check className="size-4" strokeWidth={2.5} />
        ) : (
          <Copy className="size-4" strokeWidth={2} />
        )}
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
