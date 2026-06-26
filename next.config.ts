import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions têm limite padrão de body de 1 MB. O upload do laudo
    // manda o PDF inteiro no body da action, então laudos escaneados
    // (CamScanner ~3 MB, multipágina chega fácil a 10+) estouravam com
    // "Body exceeded 1 MB limit" → POST /upload 500. Sobe o teto p/ casar
    // com MAX_PDF_BYTES (20 MB). Bug `fix-upload-bodysize` do P1.
    //
    // ⚠️ Em prod na Vercel a function tem limite próprio de ~4.5 MB de body.
    // Acima disso, o caminho certo é upload client-side direto pro Blob
    // (@vercel/blob/client) — ver TODO `fix-upload-bodysize`.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
