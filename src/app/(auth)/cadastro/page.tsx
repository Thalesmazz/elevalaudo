"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { HardHat, Loader2, Building } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cadastrar, type CadastroState } from "./actions";

const initialState: CadastroState = {};

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Perfil define o papel (RBAC leve): o engenheiro edita/assina/publica; a
// administração (síndico/administradora) extrai, vê histórico e recebe o que o
// engenheiro publica, mas não edita. O valor `gestor` é o enum legado da
// administração no banco.
const PERFIS = [
  {
    value: "engenheiro",
    label: "Engenheiro",
    desc: "Extrai, revisa, assina e publica",
    Icon: HardHat,
  },
  {
    value: "gestor",
    label: "Administração",
    desc: "Síndico/administradora — extrai e acompanha",
    Icon: Building,
  },
] as const;

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(cadastrar, initialState);
  const [role, setRole] = useState<"engenheiro" | "gestor">("engenheiro");

  return (
    <div className="relative w-full max-w-sm space-y-5">
      <div className="surface-panel space-y-6 rounded-2xl p-6 sm:p-7">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Comece a transformar laudos em dashboards.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {/* Perfil — segmented control. O input hidden carrega o valor pro action. */}
          <input type="hidden" name="role" value={role} />
          <div className="grid grid-cols-2 gap-2">
          {PERFIS.map((p) => {
            const ativo = role === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setRole(p.value)}
                aria-pressed={ativo}
                className={cn(
                  "flex min-h-28 flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all focus-visible:ring-3 focus-visible:ring-ring/35",
                  ativo
                    ? "border-brand-green-strong/40 bg-brand-green/10 shadow-sm"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <p.Icon
                  className={cn(
                    "size-4.5",
                    ativo ? "text-brand-green-strong" : "text-foreground",
                  )}
                  strokeWidth={2}
                />
                <span className="text-sm font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
              </button>
            );
          })}
          </div>

        <div className="space-y-1.5">
          <label htmlFor="nome" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            autoComplete="name"
            required
            disabled={pending}
            className={inputCls}
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            className={inputCls}
            placeholder="voce@empresa.com.br"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="senha" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            className={inputCls}
            placeholder="Mínimo 8 caracteres"
          />
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
              Criando…
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
