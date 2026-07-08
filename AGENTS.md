# ElevaLaudo

SaaS BR que transforma o laudo de inspeção de elevador (PDF) num **dashboard + resumo em português de gente** que o síndico entende sozinho — automatizando o "estagiário + Power BI".

Desafio Quinzenal #1 (Infuser). **Deadline: 07/07/2026 23h59** — vídeo 2–3 min + link no Discord `#desafio-quinzenal`.

## Antes de implementar qualquer coisa

1. `docs/80-AI-Context/INSTRUCTIONS.md` — como operar neste projeto
2. `docs/80-AI-Context/stack.md` — linguagens/libs/versões
3. `docs/80-AI-Context/NEVER-DO.md` — anti-padrões (liability, escopo)
4. `docs/10-Projects/elevalaudo/TODO.md` — o que fazer, em ordem (P0→P6)

## Regras de ouro (resumo)

- **Camada de comunicação, NÃO certificação.** O engenheiro revisa e assina; o produto nunca auto-certifica segurança. Ver `docs/60-Decisions/ADR-002-human-in-the-loop-liability.md`.
- **BR-native é o moat.** PT de gente, NBR 16858, RIA, prazos/multas municipais. Sem tradução gringa.
- **Escopo disciplinado:** 1 formato de laudo (do design partner) + 1 cidade pra começar.
- Notas do vault em PT; código em inglês; arquivos kebab-case.

O vault em `docs/` é a memória viva. Atualizar conforme o projeto evolui.
