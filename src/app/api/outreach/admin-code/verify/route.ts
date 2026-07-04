import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import OutreachConfig from "@/models/OutreachConfig";
import { guardOutreach } from "@/lib/outreach-auth";
import { verifyPin } from "@/lib/pin";

export const dynamic = "force-dynamic";

const KEY = "admin-code";

/**
 * Verify a candidate admin access code against the stored hash.
 *
 * Returns { configured, ok }: `configured` false means no DB code is set, so the
 * caller (CallCenter) should fall back to the env `ADMIN_ACCESS_CODE` seed.
 */
export async function POST(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { code } = await req.json();
    await connectDB();
    const doc = await OutreachConfig.findOne({ key: KEY }).lean<{ value: string }>();
    if (!doc) return NextResponse.json({ configured: false, ok: false }, { status: 200 });
    const ok = typeof code === "string" && verifyPin(code, doc.value);
    return NextResponse.json({ configured: true, ok }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
