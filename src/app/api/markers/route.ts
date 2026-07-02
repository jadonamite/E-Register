import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Marker from "@/models/Marker";
import { getSession } from "@/lib/auth";
import { hashPin } from "@/lib/pin";

export const dynamic = "force-dynamic";

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
const PIN_RE = /^\d{4,6}$/;

/** GET — public list for the sign-in dropdown + admin registry (never returns pins). */
export async function GET() {
  try {
    await connectDB();
    const markers = await Marker.find({}).select("name active").sort({ name: 1 }).lean();
    return NextResponse.json(markers, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load markers" }, { status: 500 });
  }
}

/** POST — exec only. Register a new marker with an initial PIN. */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { name, pin } = await req.json();

    if (!name?.trim() || !PIN_RE.test(pin || "")) {
      return NextResponse.json({ error: "Name and a 4–6 digit PIN are required" }, { status: 400 });
    }

    const exists = await Marker.findOne({ name: name.trim() });
    if (exists) return NextResponse.json({ error: "A marker with that name exists" }, { status: 409 });

    const marker = await Marker.create({ name: name.trim(), pinHash: hashPin(pin), active: true });
    return NextResponse.json({ _id: marker._id, name: marker.name, active: marker.active }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create marker" }, { status: 500 });
  }
}

/** PATCH — exec only. Toggle active and/or reset the PIN. */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { _id, active, pin } = await req.json();
    if (!_id) return NextResponse.json({ error: "Marker id required" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (typeof active === "boolean") update.active = active;
    if (pin !== undefined) {
      if (!PIN_RE.test(pin)) return NextResponse.json({ error: "PIN must be 4–6 digits" }, { status: 400 });
      update.pinHash = hashPin(pin);
    }

    const marker = await Marker.findByIdAndUpdate(_id, { $set: update }, { new: true }).select("name active");
    if (!marker) return NextResponse.json({ error: "Marker not found" }, { status: 404 });
    return NextResponse.json(marker, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update marker" }, { status: 500 });
  }
}

/** DELETE — exec only. */
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: "Marker id required" }, { status: 400 });

    await Marker.findByIdAndDelete(_id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete marker" }, { status: 500 });
  }
}
