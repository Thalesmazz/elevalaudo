"use client";

import { useActionState, useState } from "react";
import { FileUp, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadLaudo, type UploadState } from "./actions";

const initialState: UploadState = {};

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function UploadForm({
  empresas,
}: {
  empresas: { id: string; nome: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    uploadLaudo,
    initialState,
  );
  // Sem empresas ainda → já abre no modo "nova". Com empresas → escolhe uma.
  const [modo, setModo] = useState<"existente" | "nova">(
    empresas.length > 0 ? "existente" : "nova",
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Empresa/cliente da extração — agrupa o laudo na lateral. */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Empresa (cliente)</label>
          {empresas.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setModo((m) => (m === "nova" ? "existente" : "nova"))
              }
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {modo === "nova" ? (
                "Escolher existente"
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Nova empresa
                </>
              )}
            </button>
          ) : null}
        </div>

        {modo === "existente" && empresas.length > 0 ? (
          <select
            name="empresaId"
            required
            disabled={pending}
            defaultValue={empresas[0].id}
            className={inputCls}
          >
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="empresaNome"
            type="text"
            required
            minLength={2}
            disabled={pending}
            className={inputCls}
            placeholder="Nome da empresa ou condomínio"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pdf" className="text-sm font-medium">
          PDF do laudo
        </label>
        <label
          htmlFor="pdf"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <FileUp className="size-6" />
          <span>Clique para escolher o PDF do laudo</span>
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            disabled={pending}
            className="block w-full pt-2 text-xs text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
          />
        </label>
      </div>

      {state.erro ? (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando…
          </>
        ) : (
          "Enviar laudo"
        )}
      </Button>
    </form>
  );
}
