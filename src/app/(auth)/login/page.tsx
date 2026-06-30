"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

const fieldCls =
  "h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="relative w-full max-w-sm space-y-5">
      <div className="surface-panel space-y-6 rounded-2xl p-6 sm:p-7">
        <div className="space-y-1.5">
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
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2}
                aria-hidden
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={pending}
                className={fieldCls}
                placeholder="voce@empresa.com.br"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="senha" className="text-sm font-medium">
              Senha
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2}
                aria-hidden
              />
              <input
                id="senha"
                name="senha"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={pending}
                className={`${fieldCls} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPwd}
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {showPwd ? (
                  <EyeOff className="size-4" strokeWidth={2} />
                ) : (
                  <Eye className="size-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {state.erro ? (
            <p
              className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="size-4 shrink-0" strokeWidth={2.25} />
              {state.erro}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="h-11 w-full">
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
