import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Program from "@/models/Program";
import OutreachEvent from "@/models/OutreachEvent";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Ensure the Love Expression program exists, linked to its outreach event when
 * one is present. Idempotent — safe to call on every list. Keeps the attendance
 * button working with zero manual setup (no picker).
 */
async function ensureLoveExpression() {
  const existing = await Program.findOne({ name: "Love Expression" });
  if (existing) {
    // Backfill the event link if the campaign was created after the program.
    if (!existing.outreachEventId) {
      const ev = await OutreachEvent.findOne({ name: /love\s*expression/i }).select("_id");
      if (ev) {
        existing.outreachEventId = ev._id;
        await existing.save();
      }
    }
    return;
  }
  const ev = await OutreachEvent.findOne({ name: /love\s*expression/i }).select("_id");
  await Program.create({
    name: "Love Expression",
    serviceLabel: "Love Expression",
    outreachEventId: ev?._id ?? null,
    active: true,
  });
}

/** GET — active programs, each rendered as an attendance button on the register. */
export async function GET() {
  try {
    await connectDB();
    await ensureLoveExpression();
    const programs = await Program.find({ active: true }).sort({ createdAt: 1 }).lean();
    return NextResponse.json(
      programs.map((p) => ({
        id: String(p._id),
        name: p.name,
        serviceLabel: p.serviceLabel || p.name,
        hasRoster: Boolean(p.outreachEventId),
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ PROGRAMS GET:", error);
    return NextResponse.json({ error: "Failed to load programs" }, { status: 500 });
  }
}

/** POST — create a program (exec only). Future programs need no code change. */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { name, serviceLabel, outreachEventId } = await req.json();
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Program name is required" }, { status: 400 });
    }
    const created = await Program.create({
      name: name.trim(),
      serviceLabel: (serviceLabel || name).trim(),
      outreachEventId: outreachEventId || null,
    });
    return NextResponse.json({ id: String(created._id) }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "A program with that name exists" }, { status: 409 });
    }
    console.error("❌ PROGRAMS POST:", error);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}
