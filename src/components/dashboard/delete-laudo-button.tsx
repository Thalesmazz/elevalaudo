"use client";

import { useActionState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { excluirLaudo, type ExcluirState } from "@/app/(app)/laudos/actions";
import { cn } from "@/lib/utils";

/**
 * Botão de excluir uma extração com diálogo de confirmação. Avisa quando o
 * laudo já foi publicado (o link público para de funcionar). Reusa o padrão de
 * Dialog do base-ui (ver graph-modal). A server action `excluirLaudo` apaga o
 * Blob + a linha e redireciona pra `/laudos`.
 */
export function DeleteLaudoButton({
  id,
  publicado = false,
  variant = "button",
  className,
}: {
  id: string;
  publicado?: boolean;
  variant?: "button" | "icon";
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<ExcluirState, FormData>(
    excluirLaudo,
    {},
  );

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        aria-label="Excluir extração"
        className={cn(
          "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
          className,
        )}
      >
        <Trash2 className="size-4" strokeWidth={2} />
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
          className,
        )}
      >
        <Trash2 className="size-4" strokeWidth={2} />
        Excluir
      </button>
    );

  return (
    <Dialog.Root>
      <Dialog.Trigger render={trigger} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border border-border bg-popover p-5 shadow-xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4.5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-semibold">
                Excluir esta extração?
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Esta ação é permanente — o PDF e os dados extraídos serão
                removidos.
                {publicado ? (
                  <>
                    {" "}
                    Este laudo está <strong>publicado</strong>: o link público
                    deixará de funcionar.
                  </>
                ) : null}
              </Dialog.Description>
            </div>
          </div>

          {state.erro ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {state.erro}
            </p>
          ) : null}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="id" value={id} />
            <Dialog.Close className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Cancelar
            </Dialog.Close>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />
              ) : (
                <Trash2 className="size-4" strokeWidth={2.25} />
              )}
              Excluir
            </button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
