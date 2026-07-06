"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmpresaPicker } from "@/components/dashboard/empresa-picker";
import { criarLaudoManual, type CriarLaudoManualState } from "./actions";

export function NovoLaudoForm({
  empresas,
  empresaInicialId,
}: {
  empresas: { id: string; nome: string }[];
  empresaInicialId?: string;
}) {
  const [state, formAction, pending] = useActionState<
    CriarLaudoManualState,
    FormData
  >(criarLaudoManual, {});

  return (
    <form action={formAction} className="space-y-5">
      <EmpresaPicker
        empresas={empresas}
        empresaInicialId={empresaInicialId}
        disabled={pending}
      />

      {state.erro ? (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Criando…
          </>
        ) : (
          "Começar a montar o laudo"
        )}
      </Button>
    </form>
  );
}
