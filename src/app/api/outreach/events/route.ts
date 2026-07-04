import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import OutreachEvent from "@/models/OutreachEvent";
import { guardOutreach } from "@/lib/outreach-auth";
import { eventStatus } from "@/lib/outreach-status";

export const dynamic = "force-dynamic";

type EventDoc = {
  _id: unknown;
  name: string;
  admin: string;
  target: number;
  eventStart: string;
  eventEnd: string;
  campaignStart: string;
  campaignDays: number;
};

/** Client-facing shape: string id + derived status. */
function shape(e: EventDoc) {
  return {
    id: String(e._id),
    name: e.name,
    admin: e.admin,
    target: e.target,
    eventStart: e.eventStart,
    eventEnd: e.eventEnd,
    campaignStart: e.campaignStart,
    campaignDays: e.campaignDays,
    status: eventStatus(e),
  };
}

/** Shared field validation for create + edit. Returns an error string or null. */
function validateEvent(b: Record<string, unknown>): string | null {
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const admin = typeof b.admin === "string" ? b.admin.trim() : "";
  if (name.length < 2) return "Event name is required.";
  if (admin.length < 2) return "Admin name is required.";
  if (typeof b.target !== "number" || !Number.isFinite(b.target) || b.target < 1)
    return "Target must be a positive number.";
  if (typeof b.eventStart !== "string" || typeof b.eventEnd !== "string" || !b.eventStart || !b.eventEnd)
    return "Event start and end are required.";
  if (b.eventStart >= b.eventEnd) return "End time must be after start time.";
  if (typeof b.campaignStart !== "string" || !b.campaignStart) return "Campaign start is required.";
  if (typeof b.campaignDays !== "number" || !Number.isFinite(b.campaignDays) || b.campaignDays < 1)
    return "Campaign length must be at least 1 day.";
  return null;
}

function fields(b: Record<string, unknown>) {
  return {
    name: (b.name as string).trim(),
    admin: (b.admin as string).trim(),
    target: b.target as number,
    eventStart: b.eventStart as string,
    eventEnd: b.eventEnd as string,
    campaignStart: b.campaignStart as string,
    campaignDays: b.campaignDays as number,
  };
}

/** GET — every event, oldest campaign first, with a live-derived status. */
export async function GET(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    await connectDB();
    const events = await OutreachEvent.find({}).sort({ eventStart: 1 }).lean<EventDoc[]>();
    return NextResponse.json(events.map(shape), { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

/** POST — create an event. */
export async function POST(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const err = validateEvent(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    await connectDB();
    const created = await OutreachEvent.create(fields(body));
    return NextResponse.json(shape(created.toObject()), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

/** PATCH — edit an event by id. */
export async function PATCH(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!isValidObjectId(body.id)) {
      return NextResponse.json({ error: "Valid event id required" }, { status: 400 });
    }
    const err = validateEvent(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    await connectDB();
    const updated = await OutreachEvent.findByIdAndUpdate(body.id, fields(body), {
      new: true,
    }).lean<EventDoc>();
    if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(shape(updated), { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
