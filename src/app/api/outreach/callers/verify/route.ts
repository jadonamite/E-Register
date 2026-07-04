import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import Caller from "@/models/Caller";
import { verifyPin } from "@/lib/pin";
import { guardOutreach } from "@/lib/outreach-auth";

export const dynamic = "force-dynamic";

/**
 * POST — verify a caller's name + PIN. On success the CallCenter server action
 * writes the caller id/name into per-device cookies; every subsequent log
 * auto-carries the id. A generic 401 hides whether the caller exists/is active.
 */
export async function POST(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { callerId, pin } = await req.json();
    if (!isValidObjectId(callerId) || typeof pin !== "string") {
      return NextResponse.json({ error: "Caller and PIN required" }, { status: 400 });
    }

    await connectDB();
    const caller = await Caller.findById(callerId);
    if (!caller || !caller.active || !verifyPin(pin, caller.pinHash)) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    return NextResponse.json(
      {
        ok: true,
        id: String(caller._id),
        name: caller.name,
        seniorCellId: caller.seniorCellId ? String(caller.seniorCellId) : null,
        seniorCellName: caller.seniorCellName ?? null,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
