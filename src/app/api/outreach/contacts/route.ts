import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import OutreachEvent from "@/models/OutreachEvent";
import OutreachContact from "@/models/OutreachContact";
import OutreachLog from "@/models/OutreachLog";
import Group from "@/models/Group";
import { guardOutreach } from "@/lib/outreach-auth";
import { deriveStatus, nextFollowUp, type LogLike } from "@/lib/outreach-status";

export const dynamic = "force-dynamic";

/** Server-side phone/name normalisation — mirrors the CallCenter parser. */
function normalize(name: unknown, phone: unknown): { name: string; phone: string } | null {
  if (typeof name !== "string" || typeof phone !== "string") return null;
  const cleanName = name.trim();
  const cleanPhone = phone.replace(/\s/g, "").replace(/^\+234/, "0");
  if (cleanName.length < 2) return null;
  if (!/^0\d{10}$/.test(cleanPhone)) return null;
  return { name: cleanName, phone: cleanPhone };
}

type ContactDoc = {
  _id: unknown;
  eventId: unknown;
  name: string;
  phone: string;
  groupId: unknown;
  broughtBy: string;
  doNotContact: boolean;
  createdAt: Date;
};

/**
 * GET — contacts for an event, each with a status derived from its logs and its
 * next follow-up date. `?eventId=` is required.
 */
export async function GET(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const eventId = new URL(req.url).searchParams.get("eventId");
    if (!isValidObjectId(eventId)) {
      return NextResponse.json({ error: "Valid eventId is required" }, { status: 400 });
    }

    await connectDB();
    const contacts = await OutreachContact.find({ eventId })
      .sort({ createdAt: -1 })
      .lean<ContactDoc[]>();

    const ids = contacts.map((c) => c._id);
    const logs = await OutreachLog.find({ contactId: { $in: ids } }).lean<
      { contactId: unknown; at: Date; outcome: string; disposition?: string; callBackAt?: string }[]
    >();

    // Bucket logs by contact.
    const byContact = new Map<string, LogLike[]>();
    for (const l of logs) {
      const key = String(l.contactId);
      const arr = byContact.get(key) ?? [];
      arr.push({
        at: l.at.toISOString(),
        outcome: l.outcome as LogLike["outcome"],
        disposition: (l.disposition as LogLike["disposition"]) ?? null,
        callBackAt: l.callBackAt ?? null,
      });
      byContact.set(key, arr);
    }

    const rows = contacts.map((c) => {
      const cl = byContact.get(String(c._id)) ?? [];
      // TODO: `attended` will come from an event-day check-in (phone lookup in
      // e-register attendance) — false until that flow lands.
      const status = deriveStatus(cl, { doNotContact: c.doNotContact });
      const nf = nextFollowUp(cl);
      return {
        id: String(c._id),
        eventId: String(c.eventId),
        name: c.name,
        phone: c.phone,
        groupId: String(c.groupId),
        broughtBy: c.broughtBy,
        createdAt: c.createdAt?.toISOString?.() ?? null,
        status,
        attempts: cl.length,
        nextFollowUp: nf ? nf.toISOString() : null,
      };
    });

    return NextResponse.json(rows, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

/**
 * POST — bulk-insert a cell's collated list against an event. Validates and
 * dedupes by phone within the batch AND against contacts already on the event.
 * Returns { saved, skipped }.
 */
export async function POST(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { eventId, groupId, broughtBy, contacts } = await req.json();

    if (!isValidObjectId(eventId)) {
      return NextResponse.json({ error: "Valid eventId is required" }, { status: 400 });
    }
    if (!isValidObjectId(groupId)) {
      return NextResponse.json({ error: "Valid groupId is required" }, { status: 400 });
    }
    if (typeof broughtBy !== "string" || broughtBy.trim().length < 2) {
      return NextResponse.json({ error: "Rep name (broughtBy) is required" }, { status: 400 });
    }
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "No contacts supplied" }, { status: 400 });
    }

    await connectDB();

    // Referenced event + group must exist.
    const [event, group] = await Promise.all([
      OutreachEvent.exists({ _id: eventId }),
      Group.exists({ _id: groupId }),
    ]);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Existing phones on this event — the cross-batch dedupe set.
    const existing = new Set<string>(
      await OutreachContact.find({ eventId }).distinct("phone")
    );

    const seen = new Set<string>();
    const toInsert: { eventId: string; name: string; phone: string; groupId: string; broughtBy: string }[] = [];
    let skipped = 0;

    for (const row of contacts) {
      const n = normalize(row?.name, row?.phone);
      if (!n || seen.has(n.phone) || existing.has(n.phone)) {
        skipped += 1;
        continue;
      }
      seen.add(n.phone);
      toInsert.push({ eventId, name: n.name, phone: n.phone, groupId, broughtBy: broughtBy.trim() });
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ saved: 0, skipped }, { status: 200 });
    }

    // ordered:false so a racing duplicate (inserted between our dedupe read and
    // this write) rejects only its own row, not the whole batch.
    let saved = toInsert.length;
    try {
      await OutreachContact.insertMany(toInsert, { ordered: false });
    } catch (e: unknown) {
      const err = e as { code?: number; writeErrors?: unknown[]; insertedDocs?: unknown[] };
      // Only swallow duplicate-key rejections; anything else is a real failure.
      const isDupKey = err?.code === 11000 || Array.isArray(err?.writeErrors);
      if (!isDupKey && !Array.isArray(err?.insertedDocs)) throw e;
      saved = Array.isArray(err.insertedDocs)
        ? err.insertedDocs.length
        : saved - (err.writeErrors?.length ?? 0);
      skipped += toInsert.length - saved;
    }

    return NextResponse.json({ saved, skipped }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save contacts" }, { status: 500 });
  }
}

/** PATCH — flip the do-not-contact exit for a contact. */
export async function PATCH(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const { id, doNotContact } = await req.json();
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Valid contact id required" }, { status: 400 });
    }
    if (typeof doNotContact !== "boolean") {
      return NextResponse.json({ error: "doNotContact must be a boolean" }, { status: 400 });
    }

    await connectDB();
    const updated = await OutreachContact.findByIdAndUpdate(
      id,
      { doNotContact },
      { new: true }
    ).lean<ContactDoc>();
    if (!updated) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}
