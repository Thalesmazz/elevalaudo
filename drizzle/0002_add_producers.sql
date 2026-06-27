-- P4 (`producer-branding`): tabela de branding white-label do produtor.
-- Singleton no MVP (1 design partner, sem auth) — no máximo uma linha, lida por
-- getBranding(). Logo no Blob público + cor primária aplicados no dashboard,
-- link público e PDF. Aplicar no banco antes de usar /produtor.
CREATE TABLE IF NOT EXISTS "producers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text,
	"logo_url" text,
	"logo_pathname" text,
	"cor_primaria" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
