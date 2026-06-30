"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AlertCircle,
  Building,
  Eye,
  EyeOff,
  HardHat,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cadastrar, type CadastroState } from "./actions";

const initialState: CadastroState = {};

const fieldCls =
  "h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="relative w-full max-w-sm space-y-5">
      <div className="surface-panel space-y-6 rounded-2xl p-6 sm:p-7">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Comece a transformar laudos em dashboards.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {/* Perfil — segmented control. O input hidden carrega o valor pro action. */}
          <input type="hidden" name="role" value={role} />
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Seu perfil</legend>
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
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg transition-colors",
                        ativo
                          ? "bg-brand-green/25 text-brand-green-strong"
                          : "bg-secondary text-foreground",
                      )}
                    >
                      <p.Icon className="size-4.5" strokeWidth={2} />
                    </span>
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="text-xs leading-snug text-muted-foreground">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="nome" className="text-sm font-medium">
              Nome
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2}
                aria-hidden
              />
              <input
                id="nome"
                name="nome"
                type="text"
                autoComplete="name"
                required
                disabled={pending}
                className={fieldCls}
                placeholder="Seu nome"
              />
            </div>
          </div>

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
                autoComplete="new-password"
                required
                minLength={8}
                disabled={pending}
                className={`${fieldCls} pr-10`}
                placeholder="Mínimo 8 caracteres"
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
