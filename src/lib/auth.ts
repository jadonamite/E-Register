import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

/**
 * Stateless, signed-session auth.
 *
 * The session is a JWT signed with SESSION_SECRET, stored in an httpOnly
 * cookie. Because it is signed (not just a plain role string), the browser
 * cannot forge it, and because it is stateless it needs no server-side store
 * — which keeps it viable on Vercel serverless. The same token is what a
 * managed real-time provider (Pusher/Ably) would verify at its auth endpoint
 * if push channels are added later.
 */

export type Role = "PFCC" | "EXEC";

export const SESSION_COOKIE = "session";
const SESSION_TTL = "24h";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not defined in the environment");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  role: Role;
}

/** Mint a signed session JWT for the given role. */
export async function signSession(role: Role): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

/**
 * Verify a raw token string. Edge-safe (uses jose, no Node crypto), so it can
 * be called from middleware as well as route handlers. Returns null on any
 * invalid/expired/tampered token.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "PFCC" && payload.role !== "EXEC") return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Read + verify the session from the request cookies. For use in Node-runtime
 * route handlers / server components (relies on next/headers).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
