-- Laudo manual (sem PDF), engenheiro monta do zero: novo status "rascunho" e
-- as colunas de arquivo (blob/fileName/fileSize) viram opcionais, já que um
-- laudo manual nunca teve upload de PDF original.
ALTER TYPE "laudo_status" ADD VALUE 'rascunho' BEFORE 'extraindo';

ALTER TABLE "laudos" ALTER COLUMN "blob_url" DROP NOT NULL;
ALTER TABLE "laudos" ALTER COLUMN "blob_pathname" DROP NOT NULL;
ALTER TABLE "laudos" ALTER COLUMN "file_name" DROP NOT NULL;
ALTER TABLE "laudos" ALTER COLUMN "file_size" DROP NOT NULL;
