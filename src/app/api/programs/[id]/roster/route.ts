import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import Program from "@/models/Program";
import Member from "@/models/Member";
import OutreachContact from "@/models/OutreachContact";
import OutreachLog from "@/models/OutreachLog";
import HierarchyNode from "@/models/HierarchyNode";
import ProgramAttendance from "@/models/ProgramAttendance";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Normalise to the 0XXXXXXXXXX shape used across the app, so member and
 *  outreach phone formats dedupe against each other. */
function normPhone(p: unknown): string {
  if (typeof p !== "string") return "";
  return p.replace(/\s/g, "").replace(/^\+234/, "0");
}

function dayRange(dateStr: string | null): { start: Date; end: Date } {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

type Row = {
  source: "member" | "contact" | "walkin";
  id: string;
  memberId?: string;
  contactId?: string;
  name: string;
  phone: string;
  cell: string;
  role?: string;
  tag: string; // small badge label
  invitedBy?: string;
  present: boolean;
};

/**
 * GET — the live program roster: members ∪ outreach invitees (excluding
 * wrong-number and do-not-contact) ∪ walk-ins, deduped by phone (member wins
 * over invitee wins over walk-in), each flagged present for the given day.
 * Requires a session — invitee phone numbers are not public.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getSession())) {
      return NextResponse.json({ error: "Sign in to view the program roster" }, { status: 401 });
    }
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid program id" }, { status: 400 });
    }

    await connectDB();
    const program = await Program.findById(id).lean<{
      _id: unknown;
      name: string;
      serviceLabel?: string;
      outreachEventId?: unknown;
    }>();
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").toLowerCase().trim();
    const searchDigits = search.replace(/\D/g, "");
    const full = url.searchParams.get("full") === "1";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
    const { start, end } = dayRange(url.searchParams.get("date"));

    // Present set for the day, keyed by phone.
    const present = new Set<string>(
      (
        await ProgramAttendance.find({ programId: id, date: { $gte: start, $lte: end } })
          .select("phone")
          .lean<{ phone: string }[]>()
      ).map((r) => normPhone(r.phone))
    );

    // Deduped roster keyed by phone; insertion order encodes priority.
    const byPhone = new Map<string, Row>();

    // 1. Members
    const members = await Member.find({})
      .select("name phone cell role level status")
      .sort({ createdAt: -1 })
      .lean<any[]>();
    for (const m of members) {
      const phone = normPhone(m.phone);
      if (!phone || byPhone.has(phone)) continue;
      byPhone.set(phone, {
        source: "member",
        id: String(m._id),
        memberId: String(m._id),
        name: m.name,
        phone,
        cell: m.cell || (m.status === "FirstTimer" ? "First Timer" : "—"),
        role: m.role,
        tag: "Member",
        present: present.has(phone),
      });
    }

    // 2. Outreach invitees (excl. do-not-contact + wrong-number)
    if (program.outreachEventId) {
      const contacts = await OutreachContact.find({
        eventId: program.outreachEventId,
        doNotContact: { $ne: true },
      })
        .select("name phone groupId")
        .lean<any[]>();

      const contactIds = contacts.map((c) => c._id);
      const wrong = new Set<string>(
        (
          await OutreachLog.find({ contactId: { $in: contactIds }, outcome: "wrong_number" })
            .distinct("contactId")
        ).map(String)
      );

      // Resolve cell/group names in one batch.
      const groupIds = [...new Set(contacts.map((c) => String(c.groupId)))];
      const groups = await HierarchyNode.find({ _id: { $in: groupIds } }).select("name").lean<any[]>();
      const groupName = new Map(groups.map((g) => [String(g._id), g.name]));

      for (const c of contacts) {
        if (wrong.has(String(c._id))) continue;
        const phone = normPhone(c.phone);
        if (!phone || byPhone.has(phone)) continue; // member already wins
        byPhone.set(phone, {
          source: "contact",
          id: String(c._id),
          contactId: String(c._id),
          name: c.name,
          phone,
          cell: groupName.get(String(c.groupId)) || "Invitee",
          tag: "Invitee",
          present: present.has(phone),
        });
      }
    }

    // 3. Walk-ins recorded against this program.
    const walkins = await ProgramAttendance.find({ programId: id, source: "walkin" })
      .select("name phone invitedBy")
      .lean<{ name: string; phone: string; invitedBy?: string }[]>();
    for (const w of walkins) {
      const phone = normPhone(w.phone);
      if (!phone || byPhone.has(phone)) continue;
      byPhone.set(phone, {
        source: "walkin",
        id: phone,
        name: w.name,
        phone,
        cell: "Walk-in",
        tag: "Walk-in",
        invitedBy: w.invitedBy || undefined,
        present: present.has(phone),
      });
    }

    // Search + paginate.
    let rows = [...byPhone.values()];
    if (search) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          (searchDigits.length >= 3 && r.phone.replace(/\D/g, "").includes(searchDigits))
      );
    }
    const total = rows.length;
    const presentCount = rows.filter((r) => r.present).length;
    // The roster is already fully joined in memory, so returning it whole costs
    // nothing extra — clients cache it and search locally (offline support).
    const paged = full ? rows : rows.slice((page - 1) * limit, page * limit);

    return NextResponse.json(
      {
        program: { id: String(program._id), name: program.name, serviceLabel: program.serviceLabel || program.name },
        total,
        presentCount,
        page,
        limit,
        rows: paged,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ ROSTER GET:", error);
    return NextResponse.json({ error: "Failed to load roster" }, { status: 500 });
  }
}
