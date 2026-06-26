import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { LaudoExtraido } from "@/lib/schema/laudo";

// Estados do laudo (architecture.md): extraindo → revisar → publicado.
// Só `publicado` é visível pelo link público (P4). Publicar exige revisão
// humana (P2) — guardrail de liability, nunca pular.
export const laudoStatus = pgEnum("laudo_status", [
  "extraindo",
  "revisar",
  "publicado",
]);

export const laudos = pgTable("laudos", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: laudoStatus("status").notNull().default("extraindo"),

  // Arquivo original no Vercel Blob (privado).
  blobUrl: text("blob_url").notNull(),
  blobPathname: text("blob_pathname").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),

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

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Laudo = typeof laudos.$inferSelect;
export type NovoLaudo = typeof laudos.$inferInsert;
