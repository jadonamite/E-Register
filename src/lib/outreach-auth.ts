import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Bearer-key guard for the /api/outreach/* surface.
 *
 * CallCenter is the only client and it calls server-to-server, so EVERY
 * endpoint — reads included — carries `Authorization: Bearer ${OUTREACH_API_KEY}`.
 * Outreach data (invitee phone numbers, caller staff) is more sensitive than the
 * public group tree, hence no anonymous reads. Constant-time compare so the key
 * can't be recovered by timing.
 */
function keyValid(req: Request): boolean {
  const expected = process.env.OUTREACH_API_KEY;
  if (!expected) return false; // fail closed if the server isn't configured

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false; // timingSafeEqual requires equal length
  return timingSafeEqual(a, b);
}

/** Returns a 401 response when the key is missing/wrong, else null (proceed). */
export function guardOutreach(req: Request): NextResponse | null {
  return keyValid(req)
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
