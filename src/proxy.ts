import { NextResponse, type NextRequest } from "next/server";

// Nome do cookie inline de propósito: importar de `lib/auth/session` puxaria
// `server-only` + db (neon) + next/headers pro bundle do middleware (edge),
// que não deve carregar nada disso. Manter em sincronia com COOKIE_SESSAO.
const COOKIE_SESSAO = "el_session";

/**
 * Gate de rotas: sem cookie de sessão → manda pro /login.
 *
 * Aqui só checamos a PRESENÇA do cookie (barato, roda em todo request) — a
 * validação real do token contra o banco fica no `getSessao()` dos Server
 * Components. Liberadas sem login:
 * - `/login`, `/cadastro` (a própria auth);
 * - `/r/*` e `/api/r/*` — link público do síndico (read-only, ADR-006);
 * - `/api/cron/*` — disparado pelo agendador, autentica por outro meio;
 * - `/branding/*` — logo público que o PDF/react-pdf busca por URL.
 * O `matcher` já exclui `_next` e assets estáticos.
 */

// Exatas: casam só o caminho idêntico (a "/" não pode usar startsWith — casaria tudo).
// `icon.svg` é metadata route do App Router e precisa ficar pública, senão o
// navegador logado-fora recebe redirect pro /login no request do favicon.
const ROTAS_PUBLICAS_EXATAS = ["/", "/icon.svg"];
const ROTAS_PUBLICAS_PREFIXO = [
  "/login",
  "/cadastro",
  "/r/",
  "/api/r/",
  "/api/cron/",
  "/branding/",
];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publica =
    ROTAS_PUBLICAS_EXATAS.includes(pathname) ||
    ROTAS_PUBLICAS_PREFIXO.some((p) => pathname === p || pathname.startsWith(p));
  if (publica) return NextResponse.next();

  const temSessao = req.cookies.has(COOKIE_SESSAO);
  if (!temSessao) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Roda em tudo, menos assets estáticos e o favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
