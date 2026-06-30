"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Botão de tema (claro/escuro). A fonte da verdade é a classe `.dark` no
 * <html> (definida antes da hidratação pelo script em app/layout.tsx). Aqui só
 * alternamos essa classe e persistimos a escolha em localStorage("el-theme").
 *
 * Renderiza o ícone neutro (lua) até montar, pra não dar mismatch de hidratação
 * — o SSR não sabe o tema do usuário; o cliente atualiza no primeiro efeito.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // `null` enquanto não montou (SSR não sabe o tema). Vira true/false no efeito.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("el-theme", next ? "dark" : "light");
    } catch {
      // localStorage indisponível (modo privado/SSR) — segue sem persistir.
    }
    setDark(next);
  };

  const isDark = dark === true;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/35",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={2} />
      ) : (
        <Moon className="size-4" strokeWidth={2} />
      )}
      <span className="sr-only">Alternar tema</span>
    </button>
  );
}
