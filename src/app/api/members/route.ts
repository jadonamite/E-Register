import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { getSession } from "@/lib/auth";
import { resolveCellChain } from "@/lib/structure";

export const dynamic = "force-dynamic";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/**
 * A member's hierarchy must come from the admin structure. Resolves the cell
 * against the Group tree and overwrites team/seniorCell/cell with the
 * canonical spelling, so free-text drift can't re-enter the database.
 * Returns an error response when the cell isn't in the structure.
 */
async function canonicalizeHierarchy(body: any): Promise<NextResponse | null> {
  if (!body.cell) return null;
  const chain = await resolveCellChain(body.cell);
  if (!chain) {
    return NextResponse.json(
      { error: `Cell "${body.cell}" is not in the church structure — add it in Admin first` },
      { status: 400 }
    );
  }
  Object.assign(body, chain);
  return null;
}

export async function GET() {
  try {
    // Public read — guests view the register read-only. Mutations below still
    // require a session.
    await connectDB();
    const members = await Member.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(members, { status: 200 });
  } catch (error: any) {
    console.error("❌ GET ERROR:", error); 
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();
    const body = await req.json();

    // Full members must be assigned a cell; first-timers are exempt.
    if ((body.status ?? "Member") === "Member" && !body.cell) {
      return NextResponse.json({ error: "Assign a cell before saving a member" }, { status: 400 });
    }

    const invalidCell = await canonicalizeHierarchy(body);
    if (invalidCell) return invalidCell;

    const exists = await Member.findOne({ phone: body.phone });
    if (exists) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }

    const newMember = await Member.create({
      ...body,
      attendance: []
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    console.error("❌ POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// 4. NEW: Update Member Details
export async function PUT(req: Request) {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    // Converting a first-timer (or editing a member) into Member status requires a cell.
    if (updateData.status === "Member" && !updateData.cell) {
      return NextResponse.json({ error: "Assign a cell to complete the conversion" }, { status: 400 });
    }

    const invalidCell = await canonicalizeHierarchy(updateData);
    if (invalidCell) return invalidCell;

    const updatedMember = await Member.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMember) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    return NextResponse.json(updatedMember, { status: 200 });
  } catch (error: any) {
    console.error("❌ PUT ERROR:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// Permanently remove a member and their attendance history.
export async function DELETE(req: Request) {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();
    const { _id } = await req.json();

    if (!_id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    const deleted = await Member.findByIdAndDelete(_id);
    if (!deleted) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}