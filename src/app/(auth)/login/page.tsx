"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="relative w-full max-w-sm space-y-5">
      <div className="surface-panel space-y-6 rounded-2xl p-6 sm:p-7">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Acesse seu painel de laudos.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
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
            autoComplete="current-password"
            required
            disabled={pending}
            className={inputCls}
            placeholder="••••••••"
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
              Entrando…
            </>
          ) : (
            "Entrar"
          )}
        </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
