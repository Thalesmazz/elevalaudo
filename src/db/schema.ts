import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { LaudoExtraido } from "@/lib/schema/laudo";

// Estados do laudo (architecture.md): rascunho (manual, sem PDF, engenheiro
// montando do zero) | extraindo (IA processando PDF) → revisar (extração da
// IA aguardando revisão humana) → publicado. Só `publicado` é visível pelo
// link público (P4). Publicar exige revisão humana (P2) — guardrail de
// liability, nunca pular — vale tanto pra extração da IA quanto pra laudo
// montado manualmente.
export const laudoStatus = pgEnum("laudo_status", [
  "rascunho",
  "extraindo",
  "revisar",
  "publicado",
]);

export const laudos = pgTable("laudos", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: laudoStatus("status").notNull().default("extraindo"),

  // Arquivo original no Vercel Blob (privado). NULLABLE: laudo `rascunho`
  // montado manualmente pelo engenheiro nunca teve upload de PDF.
  blobUrl: text("blob_url"),
  blobPathname: text("blob_pathname"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),

  // Extração estruturada (LaudoSchema). Preenchida no persist-extraction (P1).
  extracao: jsonb("extracao").$type<LaudoExtraido>(),
  extraidoEm: timestamp("extraido_em", { withTimezone: true }),
  erroExtracao: text("erro_extracao"),

  // Revisão human-in-the-loop (P2). Preenchidos ao aprovar/assinar — o produto
  // nunca publica sem isso (ADR-002, guardrail de liability).
  assinanteNome: text("assinante_nome"),
  assinanteCrea: text("assinante_crea"),
  publicadoEm: timestamp("publicado_em", { withTimezone: true }),

  // Compartilhamento público (P4, ADR-006): token não-adivinhável gerado ao
  // publicar. O síndico abre `/r/[token]` sem login. Só laudo `publicado` é
  // visível por ele. `unique` = um laudo por token; nunca pôr dado sensível na
  // URL além do token.
  shareToken: text("share_token").unique(),

  // Chave de agrupamento do prédio para a timeline multi-laudo (P5
  // `equipamento-timeline`, ADR-007). Slug normalizado de `predio.nome`
  // (slugifyPredio em `lib/timeline.ts`), gravado ao PUBLICAR — congela a partir
  // de um nome já revisado pelo RT (human-in-the-loop), em vez de recalcular OCR
  // cru a cada query. Nullable: laudo em extraindo/revisar ainda não tem chave;
  // só `publicado` entra na timeline (guardrail de liability, ADR-002).
  predioKey: text("predio_key"),

  // Dono da extração (quem subiu o PDF logado) e a empresa/cliente sob a qual
  // ela foi feita. NULLABLE de propósito: os laudos/seed legados (anteriores ao
  // login) não têm vínculo — o app continua lendo todos eles. Novos uploads
  // gravam ambos. A lateral agrupa por `empresaId`; "Meus laudos" filtra/não por
  // `userId` conforme a tela.
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  empresaId: uuid("empresa_id").references(() => empresas.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (t) => [
  // Colunas de filtro das queries quentes: "meus laudos" e lateral (userId),
  // agrupamento por cliente (empresaId), timeline do prédio (predioKey).
  index("laudos_user_id_idx").on(t.userId),
  index("laudos_empresa_id_idx").on(t.empresaId),
  index("laudos_predio_key_idx").on(t.predioKey),
]);

export type Laudo = typeof laudos.$inferSelect;
export type NovoLaudo = typeof laudos.$inferInsert;

// Branding white-label do produtor (P4 `producer-branding`): logo + cor da
// consultoria, aplicados no dashboard, link público e PDF — o laudo fica com a
// cara do produtor, não do ElevaLaudo. MVP é singleton (1 design partner, sem
// auth): existe no máximo uma linha, lida por `getBranding()`. NEVER-DO: nada
// de multi-tenant/RBAC no MVP — quando entrar login, isto vira FK por produtor.
export const producers = pgTable("producers", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Nome da consultoria/empresa do produtor (aparece no PDF quando não há logo).
  nome: text("nome"),

  // Email do produtor — destinatário do alerta de prazo do RIA (P5
  // `alerta-prazo-ria-email`, ADR-008). Singleton/MVP: 1 destinatário, sem auth.
  // Nullable: sem email → o cron não dispara (fallback de teste: ALERTA_EMAIL_TO).
  email: text("email"),

  // Logo no Vercel Blob PÚBLICO (não é dado sensível de cliente; o PDF e o
  // dashboard precisam carregar a imagem por URL — react-pdf busca via rede).
  logoUrl: text("logo_url"),
  logoPathname: text("logo_pathname"),

  // Cor primária da marca, hex (#rrggbb). Vira a CSS var `--brand` no dashboard
  // e o acento da capa no PDF. Nunca toca nas cores RAG do semáforo (honestidade
  // visual > marca).
  corPrimaria: text("cor_primaria"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Producer = typeof producers.$inferSelect;
export type NovoProducer = typeof producers.$inferInsert;

// Perfil de quem loga. Por enquanto é só IDENTIFICAÇÃO (sem RBAC): engenheiro e
// gestor veem o mesmo app — o perfil serve pra saber quem está logado e popular
// a lateral. "gestor" cobre síndico/administradora/zelador (nome neutro, melhor
// que "síndico"). Quando entrar permissão fina, isto vira o gancho do guard.
export const userRole = pgEnum("user_role", ["engenheiro", "gestor"]);

// Usuário logado (auth email+senha). Antes o app era singleton sem login; agora
// `laudos.userId`/`empresas.ownerUserId` referenciam aqui. `senhaHash` é scrypt
// com salt embutido (lib/auth/password.ts) — NUNCA guardar senha em claro.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  role: userRole("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NovoUser = typeof users.$inferInsert;

// Sessão por token opaco guardado em cookie httpOnly (`el_session`). O token é
// aleatório (não-adivinhável); a validação lê esta tabela em vez de confiar num
// JWT auto-assinado — assim dá pra revogar (logout = delete). `expiresAt` corta
// sessão velha.
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [index("sessions_user_id_idx").on(t.userId)]);

export type Session = typeof sessions.$inferSelect;

// Empresa/Cliente: entidade ACIMA do prédio. Um cliente (ex.: administradora,
// rede de condomínios) pode ter vários prédios, e cada prédio vários laudos no
// tempo. É o agrupamento da lateral (estilo "projeto" do Claude Code): empresa →
// extrações. Pertence ao usuário que a criou (`ownerUserId`).
export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Empresa = typeof empresas.$inferSelect;
export type NovaEmpresa = typeof empresas.$inferInsert;

// Conexão Engenheiro → Administração (P6 `conexao-engenheiro-adm`). O engenheiro
// gera um CÓDIGO único (linha `pendente`, sem administração ainda); a
// administração insere o código pra vincular as contas (vira `ativa`, com
// `administracaoUserId` preenchido). A partir do vínculo, a administração
// enxerga os laudos PUBLICADOS daquele engenheiro (em `/recebidos`) — read-only,
// nunca edita (guardrail de liability + RBAC, ver lib/auth/roles.ts).
export const conexaoStatus = pgEnum("conexao_status", ["pendente", "ativa"]);

export const conexoes = pgTable("conexoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  engenheiroUserId: uuid("engenheiro_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Null enquanto o código não foi reivindicado; preenchido ao conectar.
  administracaoUserId: uuid("administracao_user_id").references(
    () => users.id,
    { onDelete: "cascade" },
  ),
  codigo: text("codigo").notNull().unique(),
  status: conexaoStatus("status").notNull().default("pendente"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  conectadoEm: timestamp("conectado_em", { withTimezone: true }),
}, (t) => [
  index("conexoes_engenheiro_idx").on(t.engenheiroUserId),
  index("conexoes_administracao_idx").on(t.administracaoUserId),
]);

export type Conexao = typeof conexoes.$inferSelect;
export type NovaConexao = typeof conexoes.$inferInsert;

// Rate limiting fixed-window em Postgres (sem Redis — auditoria 2026-07). Uma
// linha por chave "{escopo}:{id}" (ex.: "chat-pub:<token>", "login-ip:<ip>").
// O upsert atômico de 1 statement (INSERT ... ON CONFLICT) funciona no driver
// neon-http, que não suporta transação interativa. Linhas velhas são varridas
// pelo cron diário.
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});
