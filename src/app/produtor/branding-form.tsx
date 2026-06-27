"use client";

import { useActionState, useState } from "react";
import { Check, ImageUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { salvarBranding, type BrandingState } from "./actions";

const initialState: BrandingState = {};

export function BrandingForm({
  nome,
  corPrimaria,
  logoSrc,
}: {
  nome: string;
  corPrimaria: string;
  logoSrc: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    salvarBranding,
    initialState,
  );

  // Cor controlada só pra manter o swatch e o texto em sincronia enquanto edita.
  const [cor, setCor] = useState(corPrimaria || "#18181b");
  const [temCor, setTemCor] = useState(Boolean(corPrimaria));
  const [novaLogoPreview, setNovaLogoPreview] = useState<string | null>(null);

  const logoMostrada = novaLogoPreview ?? logoSrc;

  return (
    <form action={formAction} className="space-y-8">
      {/* Logo */}
      <div className="space-y-3">
        <label htmlFor="logo" className="block text-sm font-medium">
          Logo
        </label>
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-input bg-muted/30">
            {logoMostrada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoMostrada}
                alt="Logo do produtor"
                className="size-full object-contain p-2"
              />
            ) : (
              <ImageUp className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg"
              disabled={pending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setNovaLogoPreview(f ? URL.createObjectURL(f) : null);
              }}
              className="block w-full text-xs text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              PNG ou JPEG, até 2 MB. Fundo transparente fica melhor.
            </p>
            {logoSrc ? (
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name="removerLogo"
                  disabled={pending}
                  className="size-3.5"
                />
                Remover a logo atual
              </label>
            ) : null}
          </div>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <label htmlFor="nome" className="block text-sm font-medium">
          Nome da consultoria
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          defaultValue={nome}
          maxLength={120}
          disabled={pending}
          placeholder="Ex: Engenharia Vertical Ltda"
          className="block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Aparece no PDF quando não há logo.
        </p>
      </div>

      {/* Cor */}
      <div className="space-y-2">
        <span className="block text-sm font-medium">Cor da marca</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={cor}
            disabled={pending}
            onChange={(e) => {
              setCor(e.target.value);
              setTemCor(true);
            }}
            aria-label="Escolher cor da marca"
            className="size-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
          />
          <input
            type="text"
            value={temCor ? cor : ""}
            disabled={pending}
            onChange={(e) => {
              setCor(e.target.value || "#18181b");
              setTemCor(e.target.value.trim().length > 0);
            }}
            placeholder="#18181b"
            className="w-32 rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {temCor ? (
            <button
              type="button"
              onClick={() => setTemCor(false)}
              disabled={pending}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              limpar
            </button>
          ) : null}
        </div>
        {/* Só envia a cor se o produtor escolheu uma — vazio = sem cor de marca. */}
        <input type="hidden" name="corPrimaria" value={temCor ? cor : ""} />
        <p className="text-xs text-muted-foreground">
          Usada em detalhes do dashboard e do PDF. O semáforo de segurança nunca
          muda de cor.
        </p>
      </div>

      {state.erro ? (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      ) : null}
      {state.ok ? (
        <p className="flex items-center gap-1.5 text-sm text-green-700" role="status">
          <Check className="size-4" />
          Marca salva.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando…
          </>
        ) : (
          "Salvar marca"
        )}
      </Button>
    </form>
  );
}
