# ElevaLaudo

> Transforma o laudo técnico de inspeção de elevador (PDF) em um **dashboard + resumo em português claro** que o cliente final entende sozinho.

Produto **AI-native**: recebe um laudo técnico em PDF e, via LLM, extrai os dados para um objeto **estruturado e validado**, gera um painel visual e um resumo em linguagem acessível — com revisão humana antes de publicar.

## Como funciona

```
PDF do laudo
  ├─ texto puro  → unpdf extrai o texto        → modelo barato
  └─ escaneado   → document input (visão)      → modelo de qualidade
        │
        ▼
  generateObject({ model: Claude, schema: LaudoSchema /* Zod */ })   // extração tipada e validada
        │
        ▼
  revisão humana (human-in-the-loop)   // a IA gera rascunho; o engenheiro revisa e assina
        │
        ▼
  dashboard web  +  PDF branded self-contained
```

## Decisões de arquitetura

- **Saída estruturada, não texto livre** — `generateObject` + Zod (`LaudoSchema`) como fonte da verdade do domínio. Elimina parse frágil e alucinação de formato.
- **Orquestração de modelos por tarefa** — modelo forte para a extração (qualidade); modelo barato para reformatação em alto volume (custo). Acesso unificado via Vercel AI Gateway.
- **Human-in-the-loop** — a IA produz um rascunho; a responsabilidade técnica é de quem revisa e assina. O produto comunica, nunca auto-certifica.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Framework | Next.js 16 (App Router, Server Actions) · React 19 · TypeScript (strict) |
| IA | Vercel AI SDK · Vercel AI Gateway · Claude · `generateObject` + Zod · `unpdf` |
| Dados | Neon Postgres · Drizzle ORM · Vercel Blob |
| UI | Tailwind CSS · shadcn/ui · Recharts |
| Auth / Deploy | Clerk · Vercel |

## Estrutura

```
src/
├─ lib/ai/        # pipeline de extração e processamento com LLM
├─ lib/schema/    # LaudoSchema (Zod) — contrato do domínio
├─ db/            # schema Drizzle + acesso a dados
└─ app/           # upload → extração → revisão (human-in-the-loop) → dashboard
```

---

<sub>Projeto em desenvolvimento.</sub>
