import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceSession from "@/models/ServiceSession";
import HierarchyNode from "@/models/HierarchyNode";
import { getSession } from "@/lib/auth";
import { serviceMatchesISO } from "@/lib/service-schedule";

export const dynamic = "force-dynamic";

const notMarker = () =>
  NextResponse.json({ error: "Sign in as a marker to initialize the service" }, { status: 403 });

/** Start of the UTC calendar day for the given ISO date string. */
function startOfUTCDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const VALID_TEAMS = ["PS", "BG", "ALL"];

function validateWindows(mode: string, windows: any[]): string | null {
  if (!Array.isArray(windows) || windows.length === 0) return "At least one window is required";
  if (mode === "combined") {
    if (windows.length !== 1 || windows[0].team !== "ALL") {
      return "Combined mode must have exactly one window with team \"ALL\"";
    }
  } else if (mode === "separate") {
    if (windows.length > 2) return "Separate mode allows at most two windows";
    const teams = new Set<string>();
    for (const w of windows) {
      if (!["PS", "BG"].includes(w.team)) return "Separate mode windows must be team \"PS\" or \"BG\"";
      if (teams.has(w.team)) return "Duplicate team in windows";
      teams.add(w.team);
    }
  } else {
    return "mode must be \"combined\" or \"separate\"";
  }
  for (const w of windows) {
    if (!VALID_TEAMS.includes(w.team)) return "Invalid team code";
    if (!w.start || typeof w.start !== "string") return "Each window needs a start time";
  }
  return null;
}

/** Resolve team codes → the Group.name currently used for that code, for display. */
async function resolveTeamNames(windows: any[]) {
  const codes = [...new Set(windows.map((w) => w.team).filter((t) => t !== "ALL"))];
  if (codes.length === 0) return windows.map((w) => ({ ...w, teamName: null }));
  const teams = await HierarchyNode.find({ level: "TEAM", code: { $in: codes } }).lean();
  const byCode = new Map(teams.map((t: any) => [t.code, t.name]));
  return windows.map((w) => ({ ...w, teamName: w.team === "ALL" ? null : byCode.get(w.team) ?? null }));
}

/** GET ?date=YYYY-MM-DD — the session for that Sunday, or { session: null }. */
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

    const doc = await ServiceSession.findOne({ date: startOfUTCDay(date) }).lean();
    if (!doc) return NextResponse.json({ session: null }, { status: 200 });

    const windows = await resolveTeamNames((doc as any).windows);
    return NextResponse.json({ session: { ...(doc as any), windows } }, { status: 200 });
  } catch (error) {
    console.error("Service session fetch error:", error);
    return NextResponse.json({ error: "Failed to load service session" }, { status: 500 });
  }
}

/** POST — marker only. Initialize the session for a Sunday (409 if it already exists). */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "marker") return notMarker();
    await connectDB();

    const { date, mode, windows } = await req.json();
    if (!date || !mode || !windows) {
      return NextResponse.json({ error: "date, mode and windows are required" }, { status: 400 });
    }
    if (!serviceMatchesISO("Sunday", date)) {
      return NextResponse.json({ error: "A service session can only be initialized for a Sunday" }, { status: 400 });
    }
    const validationError = validateWindows(mode, windows);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const day = startOfUTCDay(date);
    const existing = await ServiceSession.findOne({ date: day });
    if (existing) {
      return NextResponse.json({ error: "This Sunday's service is already initialized" }, { status: 409 });
    }

    const created = await ServiceSession.create({
      date: day,
      mode,
      windows,
      initializedBy: session.markerId,
    });
    return NextResponse.json({ session: created }, { status: 201 });
  } catch (error) {
    console.error("Service session create error:", error);
    return NextResponse.json({ error: "Failed to initialize service session" }, { status: 500 });
  }
}

/** PATCH — marker only. Adjust an already-initialized Sunday (e.g. a team didn't run). */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "marker") return notMarker();
    await connectDB();

    const { date, mode, windows } = await req.json();
    if (!date || !mode || !windows) {
      return NextResponse.json({ error: "date, mode and windows are required" }, { status: 400 });
    }
    const validationError = validateWindows(mode, windows);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const day = startOfUTCDay(date);
    const updated = await ServiceSession.findOneAndUpdate(
      { date: day },
      { mode, windows, updatedBy: session.markerId, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ error: "No service session exists for this Sunday yet" }, { status: 404 });
    }
    return NextResponse.json({ session: updated }, { status: 200 });
  } catch (error) {
    console.error("Service session update error:", error);
    return NextResponse.json({ error: "Failed to update service session" }, { status: 500 });
  }
}
