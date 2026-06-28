-- P5 (`alerta-prazo-ria-email`, ADR-008): email do produtor, destinatário do
-- alerta de prazo do RIA disparado pelo cron diário. Singleton/MVP (1 produtor,
-- sem auth). Nullable: sem email o cron não dispara (fallback: ALERTA_EMAIL_TO).
ALTER TABLE "producers" ADD COLUMN "email" text;
