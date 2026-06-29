import "server-only";

import { randomInt } from "node:crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { conexoes, laudos, users } from "@/db/schema";
import type { LaudoExtraido } from "@/lib/schema/laudo";

/**
 * Conexão Engenheiro → Administração por código (P6). O engenheiro gera um
 * código; a administração o insere pra vincular as contas. A partir daí, a
 * administração vê os laudos PUBLICADOS daquele engenheiro (read-only).
 */

// Alfabeto sem caracteres ambíguos (0/O/1/I/L) — código fácil de ditar.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function bloco(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += ALFABETO[randomInt(ALFABETO.length)];
  return s;
}

/** Código no formato ELV-XXXX-XXXX. */
function novoCodigo(): string {
  return `ELV-${bloco(4)}-${bloco(4)}`;
}

/** Gera um novo código de convite (linha pendente) para o engenheiro. */
export async function gerarCodigoConexao(
  engenheiroUserId: string,
): Promise<string> {
  // Colisão é improvável; tenta de novo se o unique bater.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = novoCodigo();
    try {
      await db.insert(conexoes).values({ engenheiroUserId, codigo });
      return codigo;
    } catch {
      // provável colisão de `codigo` unique — tenta outro
    }
  }
  throw new Error("Não foi possível gerar um código. Tente de novo.");
}

export type ConvitePendente = { id: string; codigo: string; criadoEmIso: string };

/** Convites ainda não reivindicados do engenheiro (mais recente primeiro). */
export async function getConvitesPendentes(
  engenheiroUserId: string,
): Promise<ConvitePendente[]> {
  const rows = await db
    .select({ id: conexoes.id, codigo: conexoes.codigo, criadoEm: conexoes.createdAt })
    .from(conexoes)
    .where(
      and(
        eq(conexoes.engenheiroUserId, engenheiroUserId),
        eq(conexoes.status, "pendente"),
      ),
    )
    .orderBy(desc(conexoes.createdAt));
  return rows.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    criadoEmIso: r.criadoEm.toISOString(),
  }));
}

export type Vinculo = { nome: string; email: string; desdeIso: string | null };

/** Administrações conectadas ao engenheiro. */
export async function getAdminsDoEngenheiro(
  engenheiroUserId: string,
): Promise<Vinculo[]> {
  const rows = await db
    .select({ nome: users.nome, email: users.email, desde: conexoes.conectadoEm })
    .from(conexoes)
    .innerJoin(users, eq(conexoes.administracaoUserId, users.id))
    .where(
      and(
        eq(conexoes.engenheiroUserId, engenheiroUserId),
        eq(conexoes.status, "ativa"),
      ),
    )
    .orderBy(desc(conexoes.conectadoEm));
  return rows.map((r) => ({
    nome: r.nome,
    email: r.email,
    desdeIso: r.desde ? r.desde.toISOString() : null,
  }));
}

/** Engenheiros conectados a uma administração. */
export async function getEngenheirosDoAdmin(
  adminUserId: string,
): Promise<Vinculo[]> {
  const rows = await db
    .select({ nome: users.nome, email: users.email, desde: conexoes.conectadoEm })
    .from(conexoes)
    .innerJoin(users, eq(conexoes.engenheiroUserId, users.id))
    .where(
      and(
        eq(conexoes.administracaoUserId, adminUserId),
        eq(conexoes.status, "ativa"),
      ),
    )
    .orderBy(desc(conexoes.conectadoEm));
  return rows.map((r) => ({
    nome: r.nome,
    email: r.email,
    desdeIso: r.desde ? r.desde.toISOString() : null,
  }));
}

export type ConectarResultado = { ok?: true; engenheiro?: string; erro?: string };

/** Reivindica um código: vincula a administração ao engenheiro do convite. */
export async function conectarPorCodigo(
  adminUserId: string,
  codigoRaw: string,
): Promise<ConectarResultado> {
  const codigo = codigoRaw.trim().toUpperCase();
  if (!codigo) return { erro: "Informe o código de conexão." };

  const [convite] = await db
    .select()
    .from(conexoes)
    .where(and(eq(conexoes.codigo, codigo), isNull(conexoes.administracaoUserId)))
    .limit(1);

  if (!convite) {
    return { erro: "Código inválido ou já utilizado." };
  }
  if (convite.engenheiroUserId === adminUserId) {
    return { erro: "Você não pode se conectar a si mesmo." };
  }

  // Já conectada a este engenheiro? Evita vínculo duplicado.
  const [jaConectado] = await db
    .select({ id: conexoes.id })
    .from(conexoes)
    .where(
      and(
        eq(conexoes.engenheiroUserId, convite.engenheiroUserId),
        eq(conexoes.administracaoUserId, adminUserId),
        eq(conexoes.status, "ativa"),
      ),
    )
    .limit(1);
  if (jaConectado) {
    return { erro: "Você já está conectado a este engenheiro." };
  }

  await db
    .update(conexoes)
    .set({
      administracaoUserId: adminUserId,
      status: "ativa",
      conectadoEm: new Date(),
    })
    .where(eq(conexoes.id, convite.id));

  const [eng] = await db
    .select({ nome: users.nome })
    .from(users)
    .where(eq(users.id, convite.engenheiroUserId))
    .limit(1);

  return { ok: true, engenheiro: eng?.nome };
}

export type LaudoRecebido = {
  id: string;
  titulo: string;
  engenheiroNome: string;
  statusGeral: LaudoExtraido["statusGeral"] | null;
  totalNc: number;
  dataInspecao: string | null;
  publicadoEmIso: string | null;
};

/** Laudos PUBLICADOS dos engenheiros conectados à administração. */
export async function getLaudosRecebidos(
  adminUserId: string,
): Promise<LaudoRecebido[]> {
  const engs = await db
    .select({ id: conexoes.engenheiroUserId })
    .from(conexoes)
    .where(
      and(
        eq(conexoes.administracaoUserId, adminUserId),
        eq(conexoes.status, "ativa"),
      ),
    );
  const ids = [...new Set(engs.map((e) => e.id))];
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      id: laudos.id,
      extracao: laudos.extracao,
      publicadoEm: laudos.publicadoEm,
      engenheiroNome: users.nome,
    })
    .from(laudos)
    .innerJoin(users, eq(laudos.userId, users.id))
    .where(and(inArray(laudos.userId, ids), eq(laudos.status, "publicado")))
    .orderBy(desc(laudos.publicadoEm));

  return rows.map((r) => {
    const ex = r.extracao;
    const totalNc =
      ex?.equipamentos.reduce((n, eq) => n + eq.naoConformidades.length, 0) ?? 0;
    return {
      id: r.id,
      titulo: ex?.predio.nome ?? "Laudo",
      engenheiroNome: r.engenheiroNome,
      statusGeral: ex?.statusGeral ?? null,
      totalNc,
      dataInspecao: ex?.dataInspecao ?? null,
      publicadoEmIso: r.publicadoEm ? r.publicadoEm.toISOString() : null,
    };
  });
}
