CREATE TYPE "public"."laudo_status" AS ENUM('extraindo', 'revisar', 'publicado');--> statement-breakpoint
CREATE TABLE "laudos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "laudo_status" DEFAULT 'extraindo' NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"extracao" jsonb,
	"extraido_em" timestamp with time zone,
	"erro_extracao" text,
	"assinante_nome" text,
	"assinante_crea" text,
	"publicado_em" timestamp with time zone,
	"share_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "laudos_share_token_unique" UNIQUE("share_token")
);
