import type { NextConfig } from "next";

// CSP pragmática (auditoria 2026-07): 'unsafe-inline' em script-src porque o
// Next injeta bootstrap inline e não estamos gerando nonce no proxy —
// endurecer com nonce está no backlog. React/react-markdown escapam HTML por
// padrão, então o risco residual de XSS é baixo. img-src não precisa do
// domínio do Blob: logo é servida por /branding/logo (same-origin).
// 'unsafe-eval' SÓ em dev: React/HMR precisam de eval em desenvolvimento;
// em produção o header vai sem.
const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  // Upload client-side do laudo: o @vercel/blob/client fala com a API em
  // vercel.com/api/blob (store privado) e com *.blob.vercel-storage.com.
  "connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com https://blob.vercel-storage.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// O PDF não passa mais pelo body de server action: upload client-side direto
// pro Blob privado (/api/upload/token) resolveu o `fix-upload-bodysize` — o
// limite de ~4.5 MB da function na Vercel não se aplica mais ao laudo.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
