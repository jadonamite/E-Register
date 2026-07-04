import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import OutreachConfig from "@/models/OutreachConfig";
import { guardOutreach } from "@/lib/outreach-auth";
import { hashPin } from "@/lib/pin";

export const dynamic = "force-dynamic";

const KEY = "admin-code";

/**
 * The CallCenter admin access code, stored as a scrypt hash so it can be
 * changed from the dashboard at runtime (env `ADMIN_ACCESS_CODE` remains the
 * seed / fallback when nothing is set here).
 *
 * GET    → { configured }                  is a code set in the DB?
 * POST   { code }                          set / replace the code (min 4 chars)
 *
 * Verify lives at ./verify so a wrong code never needs the hash client-side.
 */
export async function GET(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    await connectDB();
    const doc = await OutreachConfig.exists({ key: KEY });
    return NextResponse.json({ configured: Boolean(doc) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to read config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { code } = await req.json();
    if (typeof code !== "string" || code.trim().length < 4) {
      return NextResponse.json({ error: "Code must be at least 4 characters" }, { status: 400 });
    }
    await connectDB();
    await OutreachConfig.findOneAndUpdate(
      { key: KEY },
      { value: hashPin(code.trim()) },
      { upsert: true, new: true }
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to set code" }, { status: 500 });
  }
}
