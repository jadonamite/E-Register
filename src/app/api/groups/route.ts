import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

// The level each node must sit under (null = top of the tree).
const PARENT_LEVEL: Record<string, string | null> = {
  TEAM: null,
  SENIOR_CELL: "TEAM",
  CELL: "SENIOR_CELL",
};

/** GET — the full structure tree (read by the admin builder and the member form). */
export async function GET() {
  try {
    await connectDB();
    const groups = await Group.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(groups, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load structure" }, { status: 500 });
  }
}

/** POST — exec only. Create a Team, Senior Cell, or Cell (parent validated). */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { name, level, parentId } = await req.json();

    if (!name?.trim() || !["TEAM", "SENIOR_CELL", "CELL"].includes(level)) {
      return NextResponse.json({ error: "Name and level are required" }, { status: 400 });
    }

    const needParent = PARENT_LEVEL[level];
    if (needParent) {
      if (!parentId) {
        return NextResponse.json(
          { error: `A ${level.replace("_", " ").toLowerCase()} needs a parent` },
          { status: 400 }
        );
      }
      const parent = await Group.findById(parentId);
      if (!parent || parent.level !== needParent) {
        return NextResponse.json({ error: "Invalid parent for this level" }, { status: 400 });
      }
    }

    const exists = await Group.findOne({ name: name.trim(), level });
    if (exists) return NextResponse.json({ error: "That name already exists at this level" }, { status: 409 });

    const group = await Group.create({
      name: name.trim(),
      level,
      parentId: needParent ? parentId : null,
    });
    return NextResponse.json(group, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

/** DELETE — exec only. Blocked if the node still has sub-groups. */
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: "Group id required" }, { status: 400 });

    const children = await Group.countDocuments({ parentId: _id });
    if (children > 0) {
      return NextResponse.json({ error: "Remove its sub-groups first" }, { status: 409 });
    }

    await Group.findByIdAndDelete(_id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
