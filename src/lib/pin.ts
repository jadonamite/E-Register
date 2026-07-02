import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * PIN hashing for protocol-staff markers. PINs are low-entropy (4–6 digits),
 * so we use a salted scrypt derivation and a constant-time compare. Stored as
 * "salthex:hashhex". Never store or log the raw PIN.
 */

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(pin, salt, 32);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(pin, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(derived, expected);
}
