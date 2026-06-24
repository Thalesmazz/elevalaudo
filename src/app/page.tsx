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
        Esqueleto inicial do projeto. As funcionalidades chegam a partir do P1
        do TODO.
      </p>

      <Button disabled>Em construção</Button>
    </main>
  );
}
