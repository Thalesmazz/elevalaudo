"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { laudoSchema, type LaudoExtraido } from "@/lib/schema/laudo";
import { aprovarLaudo, salvarRascunho } from "@/lib/laudo-actions";

type NcDraft = {
  descricao: string;
  plainPt: string;
  severidade: string;
  itemNbr: string;
  acao: string;
  prazo: string;
};
type EquipDraft = {
  identificacao: string;
  tipo: string;
  naoConformidades: NcDraft[];
};
type Draft = {
  predio: { nome: string; endereco: string };
  produtor: { nome: string; crea: string };
  dataInspecao: string;
  statusGeral: string;
  equipamentos: EquipDraft[];
};

const SEVERIDADES = ["urgente", "atencao", "leve"];
const STATUS_GERAL = ["seguro", "atencao", "urgente"];

const DRAFT_VAZIO: Draft = {
  predio: { nome: "", endereco: "" },
  produtor: { nome: "", crea: "" },
  dataInspecao: "",
  statusGeral: "seguro",
  equipamentos: [],
};

function paraDraft(e: LaudoExtraido | null): Draft {
  if (!e) return structuredClone(DRAFT_VAZIO);
  return {
    predio: { nome: e.predio.nome, endereco: e.predio.endereco ?? "" },
    produtor: { nome: e.produtor.nome, crea: e.produtor.crea ?? "" },
    dataInspecao: e.dataInspecao ?? "",
    statusGeral: e.statusGeral,
    equipamentos: e.equipamentos.map((eq) => ({
      identificacao: eq.identificacao,
      tipo: eq.tipo ?? "",
      naoConformidades: eq.naoConformidades.map((nc) => ({
        descricao: nc.descricao,
        plainPt: nc.plainPt,
        severidade: nc.severidade,
        itemNbr: nc.itemNbr ?? "",
        acao: nc.acao,
        prazo: nc.prazo ?? "",
      })),
    })),
  };
}

const vazio = (s: string) => (s.trim() === "" ? undefined : s.trim());

// Converte o rascunho (tudo string) pro shape do LaudoSchema, transformando
// opcionais em branco em `undefined` (campo ausente, nunca chutar).
function limpar(d: Draft): unknown {
  return {
    predio: { nome: d.predio.nome.trim(), endereco: vazio(d.predio.endereco) },
    produtor: { nome: d.produtor.nome.trim(), crea: vazio(d.produtor.crea) },
    dataInspecao: vazio(d.dataInspecao),
    statusGeral: d.statusGeral,
    equipamentos: d.equipamentos.map((eq) => ({
      identificacao: eq.identificacao.trim(),
      tipo: vazio(eq.tipo),
      naoConformidades: eq.naoConformidades.map((nc) => ({
        descricao: nc.descricao.trim(),
        plainPt: nc.plainPt.trim(),
        severidade: nc.severidade,
        itemNbr: vazio(nc.itemNbr),
        acao: nc.acao.trim(),
        prazo: vazio(nc.prazo),
      })),
    })),
  };
}

const novaNc = (): NcDraft => ({
  descricao: "",
  plainPt: "",
  severidade: "atencao",
  itemNbr: "",
  acao: "",
  prazo: "",
});
const novoEquip = (): EquipDraft => ({
  identificacao: "",
  tipo: "",
  naoConformidades: [novaNc()],
});

/**
 * Formulário de edição do laudo (predio, produtor, equipamentos, NCs) — usado
 * em dois fluxos:
 * - `modo="revisar"`: confere/corrige a extração da IA antes de publicar
 *   (`temPdfOriginal=true`, sempre tem PDF pra conferir contra).
 * - `modo="manual"`: engenheiro monta o laudo do zero, sem PDF. Ganha o botão
 *   extra "Salvar rascunho" (não exige assinatura, mantém em `rascunho`).
 * Os dois terminam no mesmo `aprovarLaudo` — publicar sempre exige nome do
 * responsável + confirmação + `laudoSchema` válido (ADR-002).
 */
export function LaudoForm({
  id,
  inicial,
  modo,
  temPdfOriginal,
}: {
  id: string;
  inicial: LaudoExtraido | null;
  modo: "revisar" | "manual";
  temPdfOriginal: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => paraDraft(inicial));
  const [assinanteNome, setAssinanteNome] = useState(
    inicial?.produtor.nome ?? "",
  );
  const [assinanteCrea, setAssinanteCrea] = useState(
    inicial?.produtor.crea ?? "",
  );
  const [confirmado, setConfirmado] = useState(false);
  const [erros, setErros] = useState<Set<string>>(new Set());
  const [topErro, setTopErro] = useState<string | null>(null);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);
  const [pending, startTransition] = useTransition();
  const [salvandoRascunho, startSalvarRascunho] = useTransition();

  const bad = (path: string) => erros.has(path);
  const inputCls = (path: string) =>
    `w-full rounded-md border px-2.5 py-1.5 text-sm bg-background ${
      bad(path) ? "border-red-500" : "border-input"
    }`;

  const mutar = (fn: (d: Draft) => void) =>
    setDraft((d) => {
      const c = structuredClone(d);
      fn(c);
      return c;
    });

  function salvar() {
    setTopErro(null);
    setRascunhoSalvo(false);
    startSalvarRascunho(async () => {
      const r = await salvarRascunho({ id, extracao: limpar(draft) });
      if (r?.erro) setTopErro(r.erro);
      else setRascunhoSalvo(true);
    });
  }

  function aprovar() {
    setTopErro(null);
    setRascunhoSalvo(false);
    const cleaned = limpar(draft);
    const res = laudoSchema.safeParse(cleaned);
    if (!res.success) {
      setErros(new Set(res.error.issues.map((i) => i.path.join("."))));
      setTopErro(
        "Há campos obrigatórios em branco. Revise os destacados em vermelho.",
      );
      return;
    }
    if (!assinanteNome.trim()) {
      setTopErro("Informe o nome do responsável técnico que assina.");
      return;
    }
    if (!confirmado) {
      setTopErro("Marque a confirmação de que revisou e assina o laudo.");
      return;
    }
    setErros(new Set());
    startTransition(async () => {
      const r = await aprovarLaudo({
        id,
        extracao: cleaned,
        assinanteNome,
        assinanteCrea,
        confirmado,
      });
      if (r?.erro) setTopErro(r.erro);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {modo === "revisar" ? "Revisão do laudo" : "Novo laudo"}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {modo === "revisar"
              ? "Confira, corrija e assine"
              : "Monte o laudo e assine"}
          </h1>
        </div>
        {temPdfOriginal ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a href={`/laudos/${id}/pdf`} target="_blank" rel="noreferrer" />
            }
          >
            <ExternalLink className="size-4" />
            Abrir PDF original
          </Button>
        ) : null}
      </div>

      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {modo === "revisar"
          ? "A extração é um rascunho da IA. Você é o responsável técnico — confira cada campo contra o PDF original antes de publicar."
          : "Preencha os dados do laudo. Nada é publicado sem a sua assinatura como responsável técnico."}
      </p>

      <section className="space-y-3 rounded-lg border border-input p-4">
        <h2 className="text-sm font-medium">Prédio e responsável</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Prédio *</span>
            <input
              className={inputCls("predio.nome")}
              value={draft.predio.nome}
              onChange={(e) =>
                mutar((d) => {
                  d.predio.nome = e.target.value;
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Endereço</span>
            <input
              className={inputCls("predio.endereco")}
              value={draft.predio.endereco}
              onChange={(e) =>
                mutar((d) => {
                  d.predio.endereco = e.target.value;
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">
              Responsável técnico *
            </span>
            <input
              className={inputCls("produtor.nome")}
              value={draft.produtor.nome}
              onChange={(e) =>
                mutar((d) => {
                  d.produtor.nome = e.target.value;
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">CREA</span>
            <input
              className={inputCls("produtor.crea")}
              value={draft.produtor.crea}
              onChange={(e) =>
                mutar((d) => {
                  d.produtor.crea = e.target.value;
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Data da inspeção</span>
            <input
              className={inputCls("dataInspecao")}
              value={draft.dataInspecao}
              onChange={(e) =>
                mutar((d) => {
                  d.dataInspecao = e.target.value;
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Status geral *</span>
            <select
              className={inputCls("statusGeral")}
              value={draft.statusGeral}
              onChange={(e) =>
                mutar((d) => {
                  d.statusGeral = e.target.value;
                })
              }
            >
              {STATUS_GERAL.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {draft.equipamentos.map((eq, ei) => (
        <section key={ei} className="space-y-3 rounded-lg border border-input p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Equipamento {ei + 1}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                mutar((d) => {
                  d.equipamentos.splice(ei, 1);
                })
              }
            >
              <Trash2 className="size-4" />
              Remover equipamento
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Identificação *</span>
              <input
                className={inputCls(`equipamentos.${ei}.identificacao`)}
                value={eq.identificacao}
                onChange={(e) =>
                  mutar((d) => {
                    d.equipamentos[ei].identificacao = e.target.value;
                  })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Tipo</span>
              <input
                className={inputCls(`equipamentos.${ei}.tipo`)}
                value={eq.tipo}
                onChange={(e) =>
                  mutar((d) => {
                    d.equipamentos[ei].tipo = e.target.value;
                  })
                }
              />
            </label>
          </div>

          <div className="space-y-3">
            {eq.naoConformidades.map((nc, ni) => {
              const base = `equipamentos.${ei}.naoConformidades.${ni}`;
              return (
                <div
                  key={ni}
                  className="space-y-2 rounded-md border border-input/70 bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Não-conformidade {ni + 1}
                    </p>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        mutar((d) => {
                          d.equipamentos[ei].naoConformidades.splice(ni, 1);
                        })
                      }
                    >
                      <Trash2 className="size-3.5" />
                      Remover
                    </Button>
                  </div>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">
                      Descrição (técnica) *
                    </span>
                    <textarea
                      rows={2}
                      className={inputCls(`${base}.descricao`)}
                      value={nc.descricao}
                      onChange={(e) =>
                        mutar((d) => {
                          d.equipamentos[ei].naoConformidades[ni].descricao =
                            e.target.value;
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">
                      Em português de gente *
                    </span>
                    <textarea
                      rows={2}
                      className={inputCls(`${base}.plainPt`)}
                      value={nc.plainPt}
                      onChange={(e) =>
                        mutar((d) => {
                          d.equipamentos[ei].naoConformidades[ni].plainPt =
                            e.target.value;
                        })
                      }
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1 text-sm">
                      <span className="text-muted-foreground">Severidade *</span>
                      <select
                        className={inputCls(`${base}.severidade`)}
                        value={nc.severidade}
                        onChange={(e) =>
                          mutar((d) => {
                            d.equipamentos[ei].naoConformidades[
                              ni
                            ].severidade = e.target.value;
                          })
                        }
                      >
                        {SEVERIDADES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-muted-foreground">Item NBR</span>
                      <input
                        className={inputCls(`${base}.itemNbr`)}
                        value={nc.itemNbr}
                        onChange={(e) =>
                          mutar((d) => {
                            d.equipamentos[ei].naoConformidades[ni].itemNbr =
                              e.target.value;
                          })
                        }
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-muted-foreground">Prazo</span>
                      <input
                        className={inputCls(`${base}.prazo`)}
                        value={nc.prazo}
                        onChange={(e) =>
                          mutar((d) => {
                            d.equipamentos[ei].naoConformidades[ni].prazo =
                              e.target.value;
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">
                      Ação corretiva *
                    </span>
                    <textarea
                      rows={2}
                      className={inputCls(`${base}.acao`)}
                      value={nc.acao}
                      onChange={(e) =>
                        mutar((d) => {
                          d.equipamentos[ei].naoConformidades[ni].acao =
                            e.target.value;
                        })
                      }
                    />
                  </label>
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                mutar((d) => {
                  d.equipamentos[ei].naoConformidades.push(novaNc());
                })
              }
            >
              <Plus className="size-4" />
              Adicionar não-conformidade
            </Button>
          </div>
        </section>
      ))}

      <Button
        variant="outline"
        onClick={() =>
          mutar((d) => {
            d.equipamentos.push(novoEquip());
          })
        }
      >
        <Plus className="size-4" />
        Adicionar equipamento
      </Button>

      <section className="space-y-3 rounded-lg border border-input p-4">
        <h2 className="text-sm font-medium">Assinatura do responsável técnico</h2>
        <p className="text-sm text-muted-foreground">
          Ao publicar, você atesta que revisou o laudo{modo === "revisar" ? " contra o original" : ""}. O produto comunica os dados — a responsabilidade técnica é sua.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Nome *</span>
            <input
              className={`w-full rounded-md border border-input px-2.5 py-1.5 text-sm bg-background`}
              value={assinanteNome}
              onChange={(e) => setAssinanteNome(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">CREA</span>
            <input
              className={`w-full rounded-md border border-input px-2.5 py-1.5 text-sm bg-background`}
              value={assinanteCrea}
              onChange={(e) => setAssinanteCrea(e.target.value)}
            />
          </label>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
          />
          <span>
            Revisei {modo === "revisar" ? "a extração contra o laudo original" : "os dados deste laudo"} e assino como responsável técnico.
          </span>
        </label>
      </section>

      {topErro ? (
        <p className="text-sm text-red-600" role="alert">
          {topErro}
        </p>
      ) : null}
      {rascunhoSalvo && !topErro ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Rascunho salvo.
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {modo === "manual" ? (
          <Button
            variant="outline"
            onClick={salvar}
            disabled={salvandoRascunho || pending}
          >
            {salvandoRascunho ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <Save className="size-4" />
                Salvar rascunho
              </>
            )}
          </Button>
        ) : null}
        <Button onClick={aprovar} disabled={pending || salvandoRascunho}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Publicando…
            </>
          ) : (
            "Assinar e publicar"
          )}
        </Button>
      </div>
    </div>
  );
}
