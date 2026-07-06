"use client";

import { useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { FileUp, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { registrarLaudoEnviado, type UploadState } from "./actions";

const PDF_MIME = "application/pdf";
const MAX_PDF_BYTES = 20 * 1024 * 1024; // espelho de lib/blob (server-only)

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function UploadForm({
  empresas,
  empresaInicialId,
}: {
  empresas: { id: string; nome: string }[];
  empresaInicialId?: string;
}) {
  const [state, setState] = useState<UploadState>({});
  const [pending, setPending] = useState(false);
  // Sem empresas ainda → já abre no modo "nova". Com empresas → escolhe uma.
  const [modo, setModo] = useState<"existente" | "nova">(
    empresas.length > 0 ? "existente" : "nova",
  );
  const empresaDefault = empresaInicialId ?? empresas[0]?.id;

  // Browser → Blob privado direto (via /api/upload/token) e só DEPOIS registra
  // o laudo na action — o body da server action era cortado em ~4.5 MB na
  // Vercel, o que quebrava PDF grande em produção (auditoria 2026-07).
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("pdf");

    if (!(file instanceof File) || file.size === 0) {
      setState({ erro: "Selecione um arquivo PDF do laudo." });
      return;
    }
    if (file.type !== PDF_MIME) {
      setState({ erro: "O arquivo precisa ser um PDF." });
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setState({ erro: "PDF muito grande (máx. 20 MB)." });
      return;
    }

    setPending(true);
    setState({});
    try {
      const id = crypto.randomUUID();
      const blob = await upload(`laudos/${id}.pdf`, file, {
        access: "private",
        handleUploadUrl: "/api/upload/token",
        contentType: PDF_MIME,
      });

      const registro = new FormData();
      registro.set("pathname", blob.pathname);
      registro.set("blobUrl", blob.url);
      registro.set("fileName", file.name);
      const empresaId = formData.get("empresaId");
      const empresaNome = formData.get("empresaNome");
      if (typeof empresaId === "string") registro.set("empresaId", empresaId);
      if (typeof empresaNome === "string") {
        registro.set("empresaNome", empresaNome);
      }

      // Em sucesso a action redireciona pra página do laudo (não retorna).
      const resultado = await registrarLaudoEnviado({}, registro);
      if (resultado?.erro) {
        setState(resultado);
        setPending(false);
      }
    } catch {
      setState({ erro: "Falha ao enviar o PDF. Tente novamente." });
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Empresa/cliente da extração — agrupa o laudo na lateral. */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Empresa (cliente)</label>
          {empresas.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setModo((m) => (m === "nova" ? "existente" : "nova"))
              }
              className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              {modo === "nova" ? (
                "Escolher existente"
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Nova empresa
                </>
              )}
            </button>
          ) : null}
        </div>

        {modo === "existente" && empresas.length > 0 ? (
          <select
            name="empresaId"
            required
            disabled={pending}
            defaultValue={empresaDefault}
            className={inputCls}
          >
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="empresaNome"
            type="text"
            required
            minLength={2}
            disabled={pending}
            className={inputCls}
            placeholder="Nome da empresa ou condomínio"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pdf" className="text-sm font-medium">
          PDF do laudo
        </label>
        <label
          htmlFor="pdf"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground transition-all hover:border-brand-green-strong/40 hover:bg-brand-green/10 focus-within:ring-3 focus-within:ring-ring/35"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
            <FileUp className="size-5 text-brand-green-strong" />
          </span>
          <span className="font-medium text-foreground">
            Clique para escolher o PDF do laudo
          </span>
          <span className="text-xs text-muted-foreground">
            Arquivo .pdf, preferencialmente com texto selecionável.
          </span>
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            disabled={pending}
            className="block w-full pt-2 text-xs text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
          />
        </label>
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
            Enviando…
          </>
        ) : (
          "Enviar laudo"
        )}
      </Button>
    </form>
  );
}
