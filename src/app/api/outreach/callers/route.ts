import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import Caller from "@/models/Caller";
import { hashPin } from "@/lib/pin";
import { guardOutreach } from "@/lib/outreach-auth";

export const dynamic = "force-dynamic";

type CallerDoc = {
  _id: unknown;
  name: string;
  active: boolean;
  seniorCellId?: unknown;
  seniorCellName?: string;
};

/** GET — the sign-in roster: active callers with their senior-cell assignment (never the hash). */
export async function GET(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    await connectDB();
    const callers = await Caller.find({ active: true }).sort({ name: 1 }).lean<CallerDoc[]>();
    return NextResponse.json(
      callers.map((c) => ({
        id: String(c._id),
        name: c.name,
        seniorCellId: c.seniorCellId ? String(c.seniorCellId) : null,
        seniorCellName: c.seniorCellName ?? null,
      })),
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
    const { name, pin, seniorCellId, seniorCellName } = await req.json();
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Caller name is required" }, { status: 400 });
    }
    if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    // Senior-cell assignment is optional; when present the id must be a real
    // Group and its name is carried through (denormalised for the roster).
    let assign: { seniorCellId?: string; seniorCellName?: string } = {};
    if (seniorCellId != null && seniorCellId !== "") {
      if (!isValidObjectId(seniorCellId)) {
        return NextResponse.json({ error: "Invalid senior cell" }, { status: 400 });
      }
      assign = {
        seniorCellId,
        seniorCellName:
          typeof seniorCellName === "string" ? seniorCellName.trim() : undefined,
      };
    }

    await connectDB();
    const exists = await Caller.findOne({ name: name.trim() });
    if (exists) return NextResponse.json({ error: "That caller already exists" }, { status: 409 });

    const caller = await Caller.create({ name: name.trim(), pinHash: hashPin(pin), ...assign });
    return NextResponse.json(
      {
        id: String(caller._id),
        name: caller.name,
        seniorCellId: caller.seniorCellId ? String(caller.seniorCellId) : null,
        seniorCellName: caller.seniorCellName ?? null,
      },
      { status: 201 }
    );
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

/**
 * PATCH — admin toggles active, resets a caller's PIN, or (re)assigns a senior
 * cell. Pass `seniorCellId: null` (or "") to clear the assignment → all-access.
 */
export async function PATCH(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { id, active, pin, seniorCellId, seniorCellName } = await req.json();
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Valid caller id required" }, { status: 400 });
    }

    const set: { active?: boolean; pinHash?: string; seniorCellId?: string; seniorCellName?: string } = {};
    const unset: Record<string, "" > = {};

    if (typeof active === "boolean") set.active = active;
    if (pin !== undefined) {
      if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
      }
      set.pinHash = hashPin(pin);
    }
    if (seniorCellId !== undefined) {
      if (seniorCellId === null || seniorCellId === "") {
        // Clear the assignment → all-access.
        unset.seniorCellId = "";
        unset.seniorCellName = "";
      } else if (!isValidObjectId(seniorCellId)) {
        return NextResponse.json({ error: "Invalid senior cell" }, { status: 400 });
      } else {
        set.seniorCellId = seniorCellId;
        if (typeof seniorCellName === "string") set.seniorCellName = seniorCellName.trim();
      }
    }

    if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    await connectDB();
    const caller = await Caller.findByIdAndUpdate(id, update, { new: true }).lean<CallerDoc>();
    if (!caller) return NextResponse.json({ error: "Caller not found" }, { status: 404 });

    return NextResponse.json({
      id: String(caller._id),
      name: caller.name,
      active: caller.active,
      seniorCellId: caller.seniorCellId ? String(caller.seniorCellId) : null,
      seniorCellName: caller.seniorCellName ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update caller" }, { status: 500 });
  }
}
