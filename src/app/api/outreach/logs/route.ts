import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import OutreachContact from "@/models/OutreachContact";
import OutreachLog from "@/models/OutreachLog";
import { guardOutreach } from "@/lib/outreach-auth";
import {
  deriveStatus,
  nextFollowUp,
  outcomeReached,
  type CallOutcome,
  type Disposition,
  type LogLike,
} from "@/lib/outreach-status";

export const dynamic = "force-dynamic";

const OUTCOMES: CallOutcome[] = [
  "answered",
  "no_answer",
  "switched_off",
  "busy",
  "wrong_number",
  "messaged",
];
const DISPOSITIONS: Disposition[] = ["coming", "not_coming", "call_back_later"];

type LogDoc = {
  _id: unknown;
  contactId: unknown;
  callerId: string;
  at: Date;
  channel: string;
  outcome: string;
  disposition?: string;
  callBackAt?: string;
  note?: string;
};

/**
 * GET — logs for a single contact (`?contactId=`) or every log across an event's
 * contacts (`?eventId=`, for dashboard analytics), newest first.
 */
export async function GET(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const url = new URL(req.url);
    const contactId = url.searchParams.get("contactId");
    const eventId = url.searchParams.get("eventId");

    await connectDB();

    let filter: Record<string, unknown>;
    if (isValidObjectId(eventId)) {
      // All logs for contacts on this event.
      const contactIds = await OutreachContact.find({ eventId }).distinct("_id");
      filter = { contactId: { $in: contactIds } };
    } else if (isValidObjectId(contactId)) {
      filter = { contactId };
    } else {
      return NextResponse.json({ error: "Valid contactId or eventId is required" }, { status: 400 });
    }

    const logs = await OutreachLog.find(filter).sort({ at: -1 }).lean<LogDoc[]>();
    return NextResponse.json(
      logs.map((l) => ({
        id: String(l._id),
        contactId: String(l.contactId),
        callerId: l.callerId,
        at: l.at.toISOString(),
        channel: l.channel,
        outcome: l.outcome,
        disposition: l.disposition ?? null,
        callBackAt: l.callBackAt ?? null,
        note: l.note ?? null,
      })),
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to load logs" }, { status: 500 });
  }
}

/**
 * POST — record one call/message attempt. Returns the contact's freshly-derived
 * status + next follow-up so the client can update without a re-fetch.
 */
export async function POST(req: Request) {
  const denied = guardOutreach(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { contactId, outcome, disposition, callBackAt, note, callerId, channel, at } = body;

    if (!isValidObjectId(contactId)) {
      return NextResponse.json({ error: "Valid contactId is required" }, { status: 400 });
    }
    if (!OUTCOMES.includes(outcome)) {
      return NextResponse.json({ error: "Unknown outcome" }, { status: 400 });
    }
    if (disposition != null && !DISPOSITIONS.includes(disposition)) {
      return NextResponse.json({ error: "Unknown disposition" }, { status: 400 });
    }
    // A disposition only makes sense when the person was actually reached.
    if (disposition != null && !outcomeReached(outcome)) {
      return NextResponse.json(
        { error: "Disposition only applies when the contact was reached" },
        { status: 400 }
      );
    }
    if (disposition === "call_back_later" && !callBackAt) {
      return NextResponse.json({ error: "Pick the call-back date" }, { status: 400 });
    }
    if (channel !== "call" && channel !== "message") {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    await connectDB();
    const contact = await OutreachContact.findById(contactId).lean<{ doNotContact: boolean }>();
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const when = at ? new Date(at) : new Date();
    if (Number.isNaN(when.getTime())) {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
    }

    await OutreachLog.create({
      contactId,
      callerId: typeof callerId === "string" && callerId ? callerId : "unassigned",
      at: when,
      channel,
      outcome,
      disposition: disposition ?? undefined,
      callBackAt: disposition === "call_back_later" ? callBackAt : undefined,
      note: typeof note === "string" && note.trim() ? note.trim() : undefined,
    });

    // Re-derive from the full set so the client sees the same status the GET would.
    const logs = await OutreachLog.find({ contactId }).lean<LogDoc[]>();
    const mapped: LogLike[] = logs.map((l) => ({
      at: l.at.toISOString(),
      outcome: l.outcome as CallOutcome,
      disposition: (l.disposition as Disposition) ?? null,
      callBackAt: l.callBackAt ?? null,
    }));
    const status = deriveStatus(mapped, { doNotContact: contact.doNotContact });
    const nf = nextFollowUp(mapped);

    return NextResponse.json(
      { ok: true, status, nextFollowUp: nf ? nf.toISOString() : null },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to log outcome" }, { status: 500 });
  }
}
