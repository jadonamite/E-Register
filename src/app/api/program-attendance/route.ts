import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import ProgramAttendance from "@/models/ProgramAttendance";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const notMarker = () =>
  NextResponse.json({ error: "Sign in as a marker to mark attendance" }, { status: 403 });

function normPhone(p: unknown): string {
  if (typeof p !== "string") return "";
  return p.replace(/\s/g, "").replace(/^\+234/, "0");
}

function startOfDay(dateStr: unknown): Date {
  const d = typeof dateStr === "string" ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * POST — check a person in at a program. Idempotent on (programId, phone, day):
 * re-marking is a no-op, so it is safe to replay. Doubles as walk-in creation
 * (source "walkin" with an inline name/phone that maps to no member/contact).
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "marker") return notMarker();
    await connectDB();

    const { programId, date, phone, name, source, memberId, contactId, invitedBy } = await req.json();

    if (!isValidObjectId(programId)) {
      return NextResponse.json({ error: "Valid programId required" }, { status: 400 });
    }
    const cleanPhone = normPhone(phone);
    if (!/^0\d{10}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 });
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!["member", "contact", "walkin"].includes(source)) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const day = startOfDay(date);

    await ProgramAttendance.updateOne(
      { programId, phone: cleanPhone, date: day },
      {
        $setOnInsert: {
          programId,
          phone: cleanPhone,
          date: day,
          name: name.trim(),
          source,
          ...(isValidObjectId(memberId) ? { memberId } : {}),
          ...(isValidObjectId(contactId) ? { contactId } : {}),
          ...(typeof invitedBy === "string" && invitedBy.trim()
            ? { invitedBy: invitedBy.trim().slice(0, 80) }
            : {}),
          markedBy: session.name,
          markedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, phone: cleanPhone }, { status: 200 });
  } catch (error) {
    console.error("❌ PROGRAM ATTENDANCE POST:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}

/** DELETE — undo a check-in for the day. */
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "marker") return notMarker();
    await connectDB();

    const { programId, date, phone } = await req.json();
    if (!isValidObjectId(programId)) {
      return NextResponse.json({ error: "Valid programId required" }, { status: 400 });
    }
    const cleanPhone = normPhone(phone);
    const day = startOfDay(date);

    await ProgramAttendance.deleteOne({ programId, phone: cleanPhone, date: day });
    return NextResponse.json({ success: true, phone: cleanPhone }, { status: 200 });
  } catch (error) {
    console.error("❌ PROGRAM ATTENDANCE DELETE:", error);
    return NextResponse.json({ error: "Failed to unmark" }, { status: 500 });
  }
}
