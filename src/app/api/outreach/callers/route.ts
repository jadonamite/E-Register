import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import Caller from "@/models/Caller";
import { hashPin } from "@/lib/pin";
import { guardOutreach } from "@/lib/outreach-auth";

export const dynamic = "force-dynamic";

type CallerDoc = { _id: unknown; name: string; active: boolean };

/** GET — the sign-in roster: active callers, id + name only (never the hash). */
export async function GET(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    await connectDB();
    const callers = await Caller.find({ active: true }).sort({ name: 1 }).lean<CallerDoc[]>();
    return NextResponse.json(
      callers.map((c) => ({ id: String(c._id), name: c.name })),
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to load callers" }, { status: 500 });
  }
}

/** POST — admin creates a caller (name + 4-digit PIN, stored hashed). */
export async function POST(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { name, pin } = await req.json();
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Caller name is required" }, { status: 400 });
    }
    if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }

    await connectDB();
    const exists = await Caller.findOne({ name: name.trim() });
    if (exists) return NextResponse.json({ error: "That caller already exists" }, { status: 409 });

    const caller = await Caller.create({ name: name.trim(), pinHash: hashPin(pin) });
    return NextResponse.json({ id: String(caller._id), name: caller.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create caller" }, { status: 500 });
  }
}

/** DELETE — admin removes a caller. Past logs keep the caller id as a string. */
export async function DELETE(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { id } = await req.json();
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Valid caller id required" }, { status: 400 });
    }
    await connectDB();
    const removed = await Caller.findByIdAndDelete(id);
    if (!removed) return NextResponse.json({ error: "Caller not found" }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete caller" }, { status: 500 });
  }
}

/** PATCH — admin toggles active or resets a caller's PIN. */
export async function PATCH(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { id, active, pin } = await req.json();
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Valid caller id required" }, { status: 400 });
    }

    const update: { active?: boolean; pinHash?: string } = {};
    if (typeof active === "boolean") update.active = active;
    if (pin !== undefined) {
      if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
      }
      update.pinHash = hashPin(pin);
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await connectDB();
    const caller = await Caller.findByIdAndUpdate(id, update, { new: true }).lean<CallerDoc>();
    if (!caller) return NextResponse.json({ error: "Caller not found" }, { status: 404 });

    return NextResponse.json({ id: String(caller._id), name: caller.name, active: caller.active });
  } catch {
    return NextResponse.json({ error: "Failed to update caller" }, { status: 500 });
  }
}
