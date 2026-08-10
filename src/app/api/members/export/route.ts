import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * CSV export of the register — name, cell, phone.
 *
 * Exec only: the plain member list is a public read, but a one-click dump of
 * every phone number is bulk PII and belongs behind the admin session.
 *
 *   GET /api/members/export                       → everyone
 *   GET /api/members/export?scope=cell&value=X    → one cell
 *   GET /api/members/export?scope=seniorCell&value=X → one senior cell
 */

/** RFC 4180 escaping: wrap every field and double any embedded quote. */
function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/** Filenames go into a Content-Disposition header — keep them boring. */
function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "all";
    const value = (url.searchParams.get("value") || "").trim();

    if (scope !== "all" && scope !== "cell" && scope !== "seniorCell") {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }
    if (scope !== "all" && !value) {
      return NextResponse.json({ error: "Pick a cell to export" }, { status: 400 });
    }

    // Case-insensitive exact match — hierarchy values are canonicalised on
    // write, but an admin picking from a list shouldn't depend on that holding.
    const filter =
      scope === "all"
        ? {}
        : { [scope]: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };

    const members = await Member.find(filter)
      .select("name cell phone")
      .sort({ cell: 1, name: 1 })
      .lean();

    const rows = [
      ["Name", "Cell", "Phone Number"],
      ...members.map((m) => [m.name, m.cell || "", m.phone]),
    ];
    // Leading BOM so Excel opens it as UTF-8 rather than mangling accents.
    const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

    const stamp = new Date().toISOString().slice(0, 10);
    const name = scope === "all" ? "all-members" : slugify(value) || scope;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="e-register-${name}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ MEMBER EXPORT:", error);
    return NextResponse.json({ error: "Failed to export members" }, { status: 500 });
  }
}
