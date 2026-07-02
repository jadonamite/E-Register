import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

/**
 * Stateless, signed-session auth.
 *
 * The session is a JWT signed with SESSION_SECRET, stored in an httpOnly
 * cookie. It carries a discriminated `kind`:
 *   - { kind: "exec" }                      → leadership (analytics + admin)
 *   - { kind: "marker", markerId, name }    → protocol staff who mark attendance
 * A browser with no valid cookie is an anonymous guest (read-only).
 *
 * Because it is signed the browser cannot forge it, and because it is
 * stateless it needs no server-side store — which keeps it viable on Vercel
 * serverless.
 */

export type ExecSession = { kind: "exec" };
export type MarkerSession = { kind: "marker"; markerId: string; name: string };
export type Session = ExecSession | MarkerSession;
export type SessionPayload = Session & JWTPayload;

export const SESSION_COOKIE = "session";
const SESSION_TTL = "24h";
const MAX_AGE = 60 * 60 * 24; // 24h — matches token TTL

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not defined in the environment");
  }
  return new TextEncoder().encode(secret);
}

/** Cookie options shared by every route that sets the session. */
export function cookieOptions(maxAge: number = MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

async function sign(payload: Session): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

/** Mint a signed leadership session. */
export function signExecSession(): Promise<string> {
  return sign({ kind: "exec" });
}

/** Mint a signed marker session tied to a specific protocol-staff member. */
export function signMarkerSession(markerId: string, name: string): Promise<string> {
  return sign({ kind: "marker", markerId, name });
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
    if (payload.kind === "exec") return payload as SessionPayload;
    if (
      payload.kind === "marker" &&
      typeof payload.markerId === "string" &&
      typeof payload.name === "string"
    ) {
      return payload as SessionPayload;
    }
    return null;
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
