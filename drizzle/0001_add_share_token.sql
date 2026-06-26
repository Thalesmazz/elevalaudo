-- P4 (ADR-006): coluna do token de compartilhamento público.
-- Aplicar no banco antes de usar /r/[token].
ALTER TABLE "laudos" ADD COLUMN "share_token" text;
ALTER TABLE "laudos" ADD CONSTRAINT "laudos_share_token_unique" UNIQUE("share_token");
