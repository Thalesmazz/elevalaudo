import { randomBytes } from "node:crypto";

/**
 * Token de compartilhamento público do laudo (P4, ADR-006).
 *
 * "Autorização por posse do link": o síndico não loga — quem tem o link, vê.
 * Logo o token precisa ser não-adivinhável. 24 bytes de aleatoriedade
 * criptográfica (`randomBytes`) = 192 bits, longe de força bruta. `base64url`
 * é seguro em URL (sem `+`, `/`, `=`), então vai cru no path `/r/[token]`.
 *
 * Trade-off (ADR-006): token vazado = laudo exposto. Mitiga com token forte +
 * `noindex` na rota. Expirar/revogar fica pra quando clientes pedirem.
 */
export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Caminho público do laudo a partir do token. */
export function sharePath(token: string): string {
  return `/r/${token}`;
}
