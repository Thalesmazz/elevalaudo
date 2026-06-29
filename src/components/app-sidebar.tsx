"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible } from "@base-ui/react/collapsible";
import {
  ChartPie,
  ChevronRight,
  FilePlus2,
  History,
  Inbox,
  LayoutList,
  Link2,
  LogOut,
  Palette,
  Plus,
} from "lucide-react";

import { GraphModal } from "@/components/graph-modal";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { statusConfig } from "@/lib/status";
import { isEngenheiro } from "@/lib/auth/roles";
import { slugifyPredio } from "@/lib/timeline";
import type { EmpresaComLaudos, LaudoDaEmpresa } from "@/lib/empresas-db";
import { logout } from "@/app/(app)/auth-actions";

/**
 * Lateral do app (estilo "projeto" do Claude Code): no topo a marca, o botão de
 * nova extração e os atalhos (Meus laudos, Branding). No meio, a árvore
 * Empresa → Prédio → extrações (o prédio aparece UMA vez, com as extrações
 * datadas embaixo — sem repetir o nome). No rodapé, usuário + logout.
 */

const ROLE_LABEL: Record<string, string> = {
  engenheiro: "Engenheiro",
  // "gestor" é o valor legado do enum; na UI é a Administração (síndico/adm.).
  gestor: "Administração",
  administracao: "Administração",
};

type PredioGrupo = {
  key: string;
  nome: string;
  laudos: LaudoDaEmpresa[];
  publicados: number;
};

/** Agrupa as extrações de uma empresa por prédio (slug normalizado do nome). */
function agruparPorPredio(laudos: LaudoDaEmpresa[]): PredioGrupo[] {
  const map = new Map<string, PredioGrupo>();
  for (const l of laudos) {
    const key = slugifyPredio(l.titulo) || l.id;
    const g = map.get(key) ?? { key, nome: l.titulo, laudos: [], publicados: 0 };
    g.laudos.push(l);
    if (l.status === "publicado") g.publicados += 1;
    map.set(key, g);
  }
  return [...map.values()];
}

/** Rótulo curto da extração: data da inspeção, ou data de envio como fallback. */
function rotuloData(l: LaudoDaEmpresa): string {
  if (l.dataInspecao?.trim()) return l.dataInspecao;
  return new Date(l.criadoEmIso).toLocaleDateString("pt-BR");
}

export function AppSidebar({
  user,
  empresas,
}: {
  user: { nome: string; role: string };
  empresas: EmpresaComLaudos[];
}) {
  const pathname = usePathname();
  const engenheiro = isEngenheiro(user.role);

  return (
    <aside className="hidden h-dvh w-76 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[1px_0_0_color-mix(in_oklch,var(--background),transparent_15%)] backdrop-blur-xl md:sticky md:top-0 md:flex">
      {/* Topo: marca + nova extração + atalhos */}
      <div className="flex flex-col gap-3 p-3.5">
        <Link href="/" className="flex items-center px-1">
          <Logo markClassName="size-6" wordClassName="text-sm" />
        </Link>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[color-mix(in_oklch,var(--primary),black_12%)] active:translate-y-px"
        >
          <FilePlus2 className="size-4" strokeWidth={2.25} />
          Nova extração
        </Link>

        <nav className="flex flex-col gap-0.5">
          <NavLink
            href="/laudos"
            Icon={LayoutList}
            label="Meus laudos"
            active={pathname === "/laudos"}
          />
          {engenheiro ? (
            <>
              <NavLink
                href="/produtor"
                Icon={Palette}
                label="Branding"
                active={pathname === "/produtor"}
              />
              <NavLink
                href="/conexoes"
                Icon={Link2}
                label="Conexões"
                active={pathname === "/conexoes"}
              />
            </>
          ) : (
            <NavLink
              href="/recebidos"
              Icon={Inbox}
              label="Recebidos"
              active={pathname === "/recebidos"}
            />
          )}
        </nav>
      </div>

      {/* Árvore Empresa → Prédio → extrações */}
      <nav className="subtle-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-sidebar-border px-2 pt-2 pb-2">
        <p className="text-kicker px-2 py-1.5">
          Empresas
        </p>

        {empresas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <Inbox className="size-5 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">
              Suas extrações por empresa aparecem aqui.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {empresas.map((empresa) => {
              const grupos = agruparPorPredio(empresa.laudos);
              return (
                <li key={empresa.id}>
                  <Collapsible.Root defaultOpen={false}>
                    <div className="group/emp flex items-center gap-0.5 rounded-lg pr-1 transition-colors hover:bg-sidebar-accent">
                      <Collapsible.Trigger className="group/trig flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/trig:rotate-90" />
                        <span className="truncate">{empresa.nome}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {empresa.laudos.length}
                        </span>
                      </Collapsible.Trigger>
                      <Link
                        href={`/upload?empresaId=${encodeURIComponent(empresa.id)}`}
                        aria-label={`Nova extração para ${empresa.nome}`}
                        title={`Nova extração para ${empresa.nome}`}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all group-hover/emp:opacity-100 hover:bg-background hover:text-foreground focus-visible:opacity-100"
                      >
                        <Plus className="size-4" strokeWidth={2.25} />
                      </Link>
                      {/* Ícone de gráfico → modal de seleção de laudos */}
                      <GraphModal empresaNome={empresa.nome} laudos={empresa.laudos}>
                        <button
                          type="button"
                          aria-label={`Gráficos de ${empresa.nome}`}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all group-hover/emp:opacity-100 hover:bg-background hover:text-foreground focus-visible:opacity-100"
                        >
                          <ChartPie className="size-4" strokeWidth={2} />
                        </button>
                      </GraphModal>
                    </div>

                    <Collapsible.Panel className="overflow-hidden">
                      <div className="ml-3.5 flex flex-col gap-1.5 border-l border-sidebar-border pt-1 pl-2">
                        {empresa.laudos.length === 0 ? (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground">
                            Sem extrações ainda
                          </p>
                        ) : (
                          grupos.map((g) => {
                            const recente = g.laudos[0];
                            const rag = recente?.statusGeral
                              ? statusConfig[recente.statusGeral]
                              : null;
                            return (
                              <div key={g.key}>
                                {/* Cabeçalho do prédio: nome UMA vez. Vira link
                                    pra timeline quando há ≥2 publicados. */}
                                {g.publicados >= 2 ? (
                                  <Link
                                    href={`/predios/${g.key}`}
                                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/35"
                                  >
                                    <span
                                      className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        rag ? rag.lampOn : "bg-muted-foreground/40",
                                      )}
                                      aria-hidden
                                    />
                                    <span className="truncate">{g.nome}</span>
                                    <History
                                      className="ml-auto size-3 shrink-0 text-muted-foreground"
                                      strokeWidth={2}
                                    />
                                  </Link>
                                ) : (
                                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-foreground">
                                    <span
                                      className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        rag ? rag.lampOn : "bg-muted-foreground/40",
                                      )}
                                      aria-hidden
                                    />
                                    <span className="truncate">{g.nome}</span>
                                  </div>
                                )}

                                <ul className="flex flex-col gap-0.5">
                                  {g.laudos.map((l) => {
                                    const ativo = pathname === `/laudos/${l.id}`;
                                    return (
                                      <li key={l.id}>
                                        <Link
                                          href={`/laudos/${l.id}`}
                                          aria-current={ativo ? "page" : undefined}
                                          className={cn(
                                            "flex items-center gap-2 rounded-md py-1.5 pr-2 pl-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/35",
                                            ativo
                                              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                                          )}
                                        >
                                          <span className="truncate">
                                            {rotuloData(l)}
                                          </span>
                                          {l.status !== "publicado" ? (
                                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground capitalize">
                                              {l.status}
                                            </span>
                                          ) : null}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </Collapsible.Panel>
                  </Collapsible.Root>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Rodapé: usuário + logout */}
      <div className="border-t border-sidebar-border p-2.5">
        <div className="flex items-center gap-2 rounded-xl bg-background/55 px-2 py-2 ring-1 ring-sidebar-border">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground uppercase">
            {user.nome.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {user.nome}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sair"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  Icon,
  label,
  active,
}: {
  href: string;
  Icon: typeof LayoutList;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/35",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-sidebar-border"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
      {label}
    </Link>
  );
}
