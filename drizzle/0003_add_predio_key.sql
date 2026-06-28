-- P5 (`equipamento-timeline`, ADR-007): chave de agrupamento do prédio para a
-- timeline multi-laudo. Slug normalizado de `predio.nome`, gravado ao PUBLICAR
-- (aprovarLaudo) — congela a partir de um nome já revisado pelo RT. Nullable:
-- laudo em extraindo/revisar ainda não tem chave; só `publicado` entra na
-- timeline (guardrail de liability, ADR-002). Aplicar antes de usar /predios.
ALTER TABLE "laudos" ADD COLUMN "predio_key" text;
