import { cn } from "@/lib/utils";

/**
 * Marca ElevaLaudo (P4). Logo próprio em vez de ícone de prateleira: um elevador
 * (domínio real) com setas sobe/desce — a seta de subir em destaque ("Eleva") —
 * sobre o tile verde da marca. Glifo sempre escuro (o tile verde é claro nos dois
 * temas). O verde nunca colide com o semáforo RAG (honestidade ≠ branding).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="ElevaLaudo"
      className={cn("shrink-0", className)}
    >
      {/* tile da marca */}
      <rect width="32" height="32" rx="8" fill="var(--brand-green)" />
      {/* cabine do elevador */}
      <rect
        x="8.5"
        y="7.5"
        width="15"
        height="17"
        rx="2.5"
        fill="none"
        stroke="#18181b"
        strokeWidth="2"
      />
      {/* divisória das portas */}
      <line x1="16" y1="8.5" x2="16" y2="23.5" stroke="#18181b" strokeWidth="1.4" />
      {/* seta SOBE (Eleva) — em destaque, com haste */}
      <path
        d="M12 17.6 L12 12.6 M10.3 14.3 L12 12.2 L13.7 14.3"
        fill="none"
        stroke="#18181b"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* seta DESCE — discreta */}
      <path
        d="M20 14.4 L20 19.4 M18.5 17.7 L20 19.6 L21.5 17.7"
        fill="none"
        stroke="#18181b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}

/**
 * Wordmark bicolor: "Eleva" no tom de tinta + "Laudo" no verde acessível da
 * marca. Tracking levemente fechado pra dar lockup.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      <span className="text-foreground">Eleva</span>
      <span className="text-brand-green-strong">Laudo</span>
    </span>
  );
}

/** Lockup completo (marca + nome), tamanho controlado por `markClassName`. */
export function Logo({
  className,
  markClassName = "size-9",
  wordClassName = "text-lg",
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <Wordmark className={wordClassName} />
    </span>
  );
}
