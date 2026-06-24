"use client";

import { useActionState } from "react";
import { FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadLaudo, type UploadState } from "./actions";

const initialState: UploadState = {};

export default function UploadPage() {
  const [state, formAction, pending] = useActionState(
    uploadLaudo,
    initialState,
  );

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Enviar laudo de elevador
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Suba o PDF do laudo de inspeção. Vamos extrair os dados e montar o
          dashboard em português de gente. Você revisa antes de publicar.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
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

        {state.erro ? (
          <p className="text-sm text-red-600" role="alert">
            {state.erro}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
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
    </main>
  );
}
