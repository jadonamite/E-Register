import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { signSession, SESSION_COOKIE, type Role } from "@/lib/auth";

/** Constant-time string compare (hash first so unequal lengths don't leak). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function resolveRole(code: string): Role | null {
  const pfcc = process.env.PFCC_ACCESS_CODE;
  const exec = process.env.EXEC_ACCESS_CODE;
  if (exec && safeEqual(code, exec)) return "EXEC";
  if (pfcc && safeEqual(code, pfcc)) return "PFCC";
  return null;
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (typeof code !== "string" || code.length === 0) {
      return NextResponse.json({ error: "Access code required" }, { status: 400 });
    }

    const role = resolveRole(code);
    if (!role) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
    }

    const token = await signSession(role);
    const res = NextResponse.json({ role }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h — matches token TTL
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
