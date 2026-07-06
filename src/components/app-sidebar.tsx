"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible } from "@base-ui/react/collapsible";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  ChartColumn,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilePen,
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
import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { statusConfig } from "@/lib/status";
import { isEngenheiro } from "@/lib/auth/roles";
import { agruparPorPredio } from "@/lib/predios";
import type { EmpresaComLaudos, LaudoDaEmpresa } from "@/lib/empresas-db";
import { logout } from "@/app/(app)/auth-actions";

/**
 * Lateral do app (estilo "projeto" do Claude Code): no topo a marca, os botões
 * de nova extração/novo laudo e os atalhos. No meio, a árvore Empresa → Prédio
 * → extrações. No rodapé, usuário + tema + logout.
 *
 * Recolhível: um toggle estreita a lateral (w-76 → w-16) e transforma os itens
 * em ícones (com tooltip). A árvore de empresas some quando recolhida — a home
 * (`/laudos`) é quem dá a visão geral nesse modo. O estado fica em localStorage.
 */

const PREFS_KEY = "el-sidebar-prefs";

// Largura da lateral expandida (px). Default 304 = o antigo `w-76`. O usuário
// pode arrastar a borda pra ajustar dentro desse intervalo.
const LARGURA_PADRAO = 304;
const LARGURA_MIN = 220;
const LARGURA_MAX = 460;
const clampLargura = (w: number) =>
  Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, w));

type SidebarPrefs = { collapsed?: boolean; width?: number };

/** Grava só as chaves passadas, preservando o resto (evita corrida drag/toggle). */
function salvarPrefs(patch: SidebarPrefs) {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const cur = raw ? (JSON.parse(raw) as SidebarPrefs) : {};
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...cur, ...patch }));
  } catch {
    // localStorage indisponível — segue sem persistir.
  }
}

const ROLE_LABEL: Record<string, string> = {
  engenheiro: "Engenheiro",
  // "gestor" é o valor legado do enum; na UI é a Administração (síndico/adm.).
  gestor: "Administração",
  administracao: "Administração",
};

/** Rótulo curto da extração: data da inspeção, ou data de envio como fallback. */
function rotuloData(l: LaudoDaEmpresa): string {
  if (l.dataInspecao?.trim()) return l.dataInspecao;
  return new Date(l.criadoEmIso).toLocaleDateString("pt-BR");
}

/**
 * Tooltip do modo recolhido: mostra o rótulo à direita do ícone. Só é usado
 * quando a lateral está recolhida (o item expandido já mostra o texto). O filho
 * precisa ser um elemento que encaminhe ref (Link/button) — igual ao padrão do
 * Dialog.Trigger no GraphModal.
 */
function IconTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={8}>
          <Tooltip.Popup className="z-50 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-sidebar-border">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
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
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(LARGURA_PADRAO);
  const [resizing, setResizing] = useState(false);

  // Lê as preferências no mount com queueMicrotask (evita mismatch de
  // hidratação — o SSR não conhece o localStorage). Mesmo padrão do laudo-chat.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as SidebarPrefs;
        queueMicrotask(() => {
          if (typeof p.collapsed === "boolean") setCollapsed(p.collapsed);
          if (typeof p.width === "number") setWidth(clampLargura(p.width));
        });
      }
    } catch {
      // localStorage indisponível/corrompido — segue com os defaults.
    }
  }, []);

  // Persiste `collapsed` na hora; `width` é gravado no fim do arrasto (evita
  // centenas de writes por segundo enquanto redimensiona).
  useEffect(() => {
    salvarPrefs({ collapsed });
  }, [collapsed]);

  function iniciarResize(e: React.PointerEvent) {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startW = width;
    const onMove = (ev: PointerEvent) => {
      setWidth(clampLargura(startW + (ev.clientX - startX)));
    };
    const onUp = (ev: PointerEvent) => {
      setResizing(false);
      salvarPrefs({ width: clampLargura(startW + (ev.clientX - startX)) });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Acessibilidade: setas ajustam a largura pelo teclado (16px por passo).
  function onResizeKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setWidth((w) => {
        const next = clampLargura(w - 16);
        salvarPrefs({ width: next });
        return next;
      });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setWidth((w) => {
        const next = clampLargura(w + 16);
        salvarPrefs({ width: next });
        return next;
      });
    }
  }

  return (
    <Tooltip.Provider delay={200}>
      <aside
        style={collapsed ? undefined : { width }}
        className={cn(
          "relative hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[1px_0_0_color-mix(in_oklch,var(--background),transparent_15%)] backdrop-blur-xl md:sticky md:top-0 md:flex",
          // Sem transição durante o arrasto (senão a largura "persegue" o mouse).
          !resizing &&
            "transition-[width] duration-200 ease-out motion-reduce:transition-none",
          collapsed && "w-16",
        )}
      >
        {/* Topo: marca + toggle + ações + atalhos */}
        <div className={cn("flex flex-col gap-3", collapsed ? "items-center p-2" : "p-3.5")}>
          <div
            className={cn(
              "flex w-full items-center",
              collapsed ? "flex-col gap-1" : "justify-between",
            )}
          >
            <Link href="/laudos" className="flex items-center px-1 py-1">
              {collapsed ? (
                <LogoMark className="size-9" />
              ) : (
                <Logo markClassName="size-9" wordClassName="text-xl" />
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!collapsed}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              {collapsed ? (
                <ChevronsRight className="size-4" strokeWidth={2.25} />
              ) : (
                <ChevronsLeft className="size-4" strokeWidth={2.25} />
              )}
            </button>
          </div>

          <ActionLink
            href="/upload"
            Icon={FilePlus2}
            label="Nova extração"
            variant="primary"
            collapsed={collapsed}
          />
          {engenheiro ? (
            <ActionLink
              href="/laudos/novo"
              Icon={FilePen}
              label="Novo laudo"
              variant="outline"
              collapsed={collapsed}
            />
          ) : null}

          <nav className={cn("flex flex-col gap-0.5", collapsed && "items-center")}>
            <NavLink
              href="/laudos"
              Icon={LayoutList}
              label="Meus laudos"
              active={pathname === "/laudos"}
              collapsed={collapsed}
            />
            {engenheiro ? (
              <>
                <NavLink
                  href="/produtor"
                  Icon={Palette}
                  label="Branding"
                  active={pathname === "/produtor"}
                  collapsed={collapsed}
                />
                <NavLink
                  href="/conexoes"
                  Icon={Link2}
                  label="Conexões"
                  active={pathname === "/conexoes"}
                  collapsed={collapsed}
                />
              </>
            ) : (
              <NavLink
                href="/recebidos"
                Icon={Inbox}
                label="Recebidos"
                active={pathname === "/recebidos"}
                collapsed={collapsed}
              />
            )}
          </nav>
        </div>

        {/* Árvore Empresa → Prédio → extrações (some quando recolhido) */}
        {collapsed ? (
          <div className="flex-1" />
        ) : (
          <nav className="subtle-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-sidebar-border px-2 pt-2 pb-2">
            <p className="text-kicker px-2 py-1.5">Empresas</p>

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
                          {/* Ícone de gráfico → modal de seleção de laudos.
                              ChartColumn (mesmo da seção "Gráficos por prédio")
                              deixa claro que abre os gráficos da empresa. */}
                          <GraphModal empresaNome={empresa.nome} laudos={empresa.laudos}>
                            <button
                              type="button"
                              aria-label={`Ver gráficos de ${empresa.nome}`}
                              title={`Ver gráficos de ${empresa.nome}`}
                              className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all group-hover/emp:opacity-100 hover:bg-background hover:text-foreground focus-visible:opacity-100"
                            >
                              <ChartColumn className="size-4" strokeWidth={2} />
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
        )}

        {/* Rodapé: usuário + tema + logout */}
        <div className="border-t border-sidebar-border p-2.5">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <span
                title={user.nome}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground uppercase"
              >
                {user.nome.slice(0, 1)}
              </span>
              <ThemeToggle className="size-8 rounded-md border-0 hover:bg-sidebar-accent" />
              <form action={logout}>
                <button
                  type="submit"
                  aria-label="Sair"
                  title="Sair"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          ) : (
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
              <ThemeToggle className="size-8 rounded-md border-0 hover:bg-sidebar-accent" />
              <form action={logout}>
                <button
                  type="submit"
                  aria-label="Sair"
                  title="Sair"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Puxador de redimensionamento na borda direita (só expandido). */}
        {!collapsed ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar menu"
            aria-valuenow={Math.round(width)}
            aria-valuemin={LARGURA_MIN}
            aria-valuemax={LARGURA_MAX}
            tabIndex={0}
            onPointerDown={iniciarResize}
            onKeyDown={onResizeKey}
            title="Arraste para redimensionar"
            className="group/resize absolute inset-y-0 right-0 z-20 hidden w-2 translate-x-1/2 cursor-col-resize touch-none outline-none md:block"
          >
            <span
              className={cn(
                "absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full transition-colors",
                resizing
                  ? "bg-brand-green-strong"
                  : "bg-transparent group-hover/resize:bg-brand-green-strong/50 group-focus-visible/resize:bg-brand-green-strong/60",
              )}
            />
          </div>
        ) : null}
      </aside>
    </Tooltip.Provider>
  );
}

/** Botão de ação do topo (Nova extração / Novo laudo) nos dois estados. */
function ActionLink({
  href,
  Icon,
  label,
  variant,
  collapsed,
}: {
  href: string;
  Icon: typeof LayoutList;
  label: string;
  variant: "primary" | "outline";
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm transition-all active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring/35",
        variant === "primary"
          ? "bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-[color-mix(in_oklch,var(--primary),black_12%)]"
          : "border border-input font-medium text-foreground hover:bg-sidebar-accent",
        collapsed ? "size-10" : "w-full gap-2 px-3 py-2.5",
      )}
    >
      <Icon className="size-4" strokeWidth={2.25} />
      {collapsed ? <span className="sr-only">{label}</span> : label}
    </Link>
  );
  return collapsed ? <IconTooltip label={label}>{link}</IconTooltip> : link;
}

function NavLink({
  href,
  Icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  Icon: typeof LayoutList;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/35",
        collapsed ? "size-10 justify-center" : "gap-2 px-2 py-1.5",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-sidebar-border"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
      {collapsed ? <span className="sr-only">{label}</span> : label}
    </Link>
  );
  return collapsed ? <IconTooltip label={label}>{link}</IconTooltip> : link;
}
