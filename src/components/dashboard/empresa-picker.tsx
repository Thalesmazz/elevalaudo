"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Seletor de empresa/cliente reaproveitado entre "Nova extração" (upload) e
 * "Novo laudo" (manual): escolhe uma empresa existente ou digita o nome de
 * uma nova (criada na hora pelo `resolverEmpresaDoForm`).
 */
export function EmpresaPicker({
  empresas,
  empresaInicialId,
  disabled,
}: {
  empresas: { id: string; nome: string }[];
  empresaInicialId?: string;
  disabled?: boolean;
}) {
  const [modo, setModo] = useState<"existente" | "nova">(
    empresas.length > 0 ? "existente" : "nova",
  );
  const empresaDefault = empresaInicialId ?? empresas[0]?.id;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Empresa (cliente)</label>
        {empresas.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              setModo((m) => (m === "nova" ? "existente" : "nova"))
            }
            className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
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
          disabled={disabled}
          defaultValue={empresaDefault}
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
          disabled={disabled}
          className={inputCls}
          placeholder="Nome da empresa ou condomínio"
        />
      )}
    </div>
  );
}
