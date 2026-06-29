/**
 * Papéis do produto (RBAC leve). São DOIS:
 * - `engenheiro` — parte técnica: extrai, edita/revisa, assina e publica.
 * - `administracao` — síndico/administradora: extrai, vê histórico e recebe o
 *   que o engenheiro publica, MAS nunca edita/assina o laudo.
 *
 * O enum do banco ainda usa o valor legado `gestor` — aqui ele é tratado como
 * `administracao`. Helpers puros (sem server-only) pra usar no servidor e no
 * cliente. A linguagem do dashboard é definida pelo papel (sem toggle): a
 * administração vê "PT de gente"; o engenheiro vê o modo técnico.
 */

export type Papel = "engenheiro" | "administracao";

export const PAPEL_LABEL: Record<Papel, string> = {
  engenheiro: "Engenheiro",
  administracao: "Administração",
};

/** Normaliza o valor do enum (`gestor` legado = administração). */
export function papelDe(role: string): Papel {
  return role === "engenheiro" ? "engenheiro" : "administracao";
}

export function isEngenheiro(role: string): boolean {
  return papelDe(role) === "engenheiro";
}

/** Só o engenheiro edita/assina/publica laudo (guardrail de liability + RBAC). */
export function podeEditarLaudo(role: string): boolean {
  return isEngenheiro(role);
}

/** Audiência do dashboard derivada do papel: define a linguagem padrão. */
export function audienciaDe(role: string): "sindico" | "tecnico" {
  return isEngenheiro(role) ? "tecnico" : "sindico";
}
