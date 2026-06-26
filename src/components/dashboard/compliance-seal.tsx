import { Building2, Info, Receipt, ScrollText } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  estimarCompliance,
  resolverCidade,
  riaStatusConfig,
  type CidadeCompliance,
} from "@/lib/compliance";

/**
 * Selo de compliance municipal (P3 `dashboard-compliance-municipal`).
 *
 * Mostra o status do RIA (Relatório de Inspeção Anual) vs a lei da cidade do
 * design partner: prazo estimado de envio à prefeitura e multa estimada se não
 * emitir. Mesma linguagem visual do hero e da lista de NC (card rounded-xl
 * border-border bg-card, barra lateral colorida, badge de status).
 *
 * Liability (ADR-002 / NEVER-DO): leitura/ESTIMATIVA, nunca atestado legal.
 * Todo valor monetário/legal sai marcado como "estimado". O rodapé reforça que
 * o produto comunica, não certifica.
 */

type ComplianceSealProps = {
  dataInspecao?: string;
  /** Endereço do prédio no laudo — resolve a cidade/lei aplicável. */
  endereco?: string;
  /** Override explícito da cidade (testes). Tem prioridade sobre o endereço. */
  cidade?: CidadeCompliance;
  /** Injetável para testes determinísticos (sandbox). */
  hoje?: Date;
};

export function ComplianceSeal({
  dataInspecao,
  endereco,
  cidade: cidadeOverride,
  hoje,
}: ComplianceSealProps) {
  const cidade = cidadeOverride ?? resolverCidade(endereco);
  const est = estimarCompliance(dataInspecao, cidade, hoje);
  const cfg = riaStatusConfig[est.status];
  const city = est.cidade;

  return (
    <section
      aria-label={`Compliance municipal: RIA ${cfg.label}`}
      className={cn(
        "rounded-xl border border-l-4 border-border bg-card",
        cfg.borderAccent,
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Compliance municipal
            </p>
            <h2 className="mt-1.5 flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Building2
                className="size-5 shrink-0 text-muted-foreground"
                strokeWidth={2}
              />
              {city?.cidade ?? "Município não identificado"}
              {city ? (
                <span className="font-mono text-sm font-normal text-muted-foreground">
                  {city.uf}
                </span>
              ) : null}
            </h2>
          </div>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset",
              cfg.pill,
            )}
          >
            <cfg.Icon className="size-4" strokeWidth={2.25} />
            RIA {cfg.label}
          </span>
        </div>

        <p className="mt-4 text-base leading-relaxed text-foreground/90">
          {est.resumo}
        </p>

        {/* Prazo estimado + multa estimada. Dois blocos lado a lado, sem card
            aninhado — só um divisor, igual ao rodapé da nc-list. */}
        <dl className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-2">
          <div className="bg-card p-4">
            <dt className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <ScrollText className="size-4" strokeWidth={2} />
              Envio à prefeitura
            </dt>
            <dd className="mt-1.5 text-sm text-foreground/90">
              {est.vencimentoLabel ? (
                <>
                  Renovar e enviar até{" "}
                  <span className="font-medium">{est.vencimentoLabel}</span>{" "}
                  <span className="text-muted-foreground">(estimado)</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Sem data para estimar o prazo
                </span>
              )}
            </dd>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {city?.lei ?? "Confirme a lei municipal aplicável"}
            </p>
          </div>

          <div className="bg-card p-4">
            <dt className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Receipt className="size-4" strokeWidth={2} />
              Multa estimada
            </dt>
            <dd className="mt-1.5 text-sm text-foreground/90">
              {city?.multaEstimada ? (
                <>
                  <span className="font-medium">{city.multaEstimada}</span>{" "}
                  <span className="text-muted-foreground">(estimado)</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Sem valor documentado para este município — consulte a
                  prefeitura
                </span>
              )}
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              Por não emitir/enviar o RIA. Valor varia e muda.
            </p>
          </div>
        </dl>
      </div>

      {/* Rodapé de liability: o produto comunica, não certifica. */}
      <div className="flex items-start gap-2 border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-6">
        <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
        <span>
          Estimativa para orientar, não atestado legal. Prazos e multas variam
          por cidade e mudam. Confirme com a prefeitura e o responsável técnico.
        </span>
      </div>
    </section>
  );
}
