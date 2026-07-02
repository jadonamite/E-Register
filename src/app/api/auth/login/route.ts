import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { signExecSession, SESSION_COOKIE, cookieOptions } from "@/lib/auth";

/** Constant-time string compare (hash first so unequal lengths don't leak). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Leadership (EXEC) sign-in. Attendance marking is handled by /api/auth/marker. */
export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (typeof code !== "string" || code.length === 0) {
      return NextResponse.json({ error: "Access code required" }, { status: 400 });
    }

    const exec = process.env.EXEC_ACCESS_CODE;
    if (!exec || !safeEqual(code, exec)) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
    }

    const token = await signExecSession();
    const res = NextResponse.json({ kind: "exec" }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
