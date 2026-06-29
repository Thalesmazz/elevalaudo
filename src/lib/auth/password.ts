import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hash de senha com `scrypt` (built-in do Node) — sem dependência externa.
 *
 * Formato do hash guardado: `scrypt$<saltHex>$<derivedHex>`. O salt é aleatório
 * por senha e fica embutido na string, então `verificarSenha` se basta com o
 * hash + a senha digitada. NUNCA guardar senha em claro (schema.ts).
 *
 * A comparação usa `timingSafeEqual` pra não vazar tempo. scrypt é deliberada-
 * mente lento (custo de CPU/memória) — defesa contra brute force offline.
 */

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(senha, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verificarSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  const [esquema, saltHex, derivedHex] = hash.split("$");
  if (esquema !== "scrypt" || !saltHex || !derivedHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const esperado = Buffer.from(derivedHex, "hex");
  const derived = (await scryptAsync(senha, salt, esperado.length)) as Buffer;

  // timingSafeEqual exige buffers do mesmo tamanho.
  return (
    derived.length === esperado.length && timingSafeEqual(derived, esperado)
  );
}
