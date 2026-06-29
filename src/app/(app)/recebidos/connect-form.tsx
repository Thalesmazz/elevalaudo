"use client";

import { useActionState } from "react";
import { Link2, Loader2 } from "lucide-react";

import { conectar, type ConectarState } from "./actions";

/** Formulário da administração para conectar a um engenheiro por código. */
export function ConnectForm() {
  const [state, formAction, pending] = useActionState<ConectarState, FormData>(
    conectar,
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="codigo"
          placeholder="ELV-XXXX-XXXX"
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm tracking-wider uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Link2 className="size-4" strokeWidth={2.25} />
          )}
          Conectar
        </button>
      </div>
      {state.erro ? (
        <p className="text-sm text-destructive" role="alert">
          {state.erro}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-brand-green-strong" role="status">
          Conectado{state.engenheiro ? ` a ${state.engenheiro}` : ""}! Os laudos
          publicados já aparecem abaixo.
        </p>
      ) : null}
    </form>
  );
}
