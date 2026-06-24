import Link from "next/link";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="size-5" />
        <span className="text-sm font-medium tracking-wide uppercase">
          ElevaLaudo
        </span>
      </div>

      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Laudo de elevador vira dashboard em português de gente
      </h1>

      <p className="max-w-xl text-muted-foreground text-pretty">
        Suba o PDF do laudo de inspeção e receba um dashboard com semáforo,
        não-conformidades e resumo em português que o síndico entende sozinho.
      </p>

      <Button nativeButton={false} render={<Link href="/upload" />}>
        Enviar laudo
      </Button>
    </main>
  );
}
