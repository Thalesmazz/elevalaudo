import { defineConfig } from "drizzle-kit";

// Conexão Drizzle ↔ Neon. Schema de domínio chega no P1 (zod-laudo-schema).
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
