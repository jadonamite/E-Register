import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import Member from "@/models/Member";
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

/**
 * PATCH — exec only. Two actions:
 *   { _id, name }        → rename (propagates to the member-form tree)
 *   { _id, promote:true} → lift one level: CELL→SENIOR_CELL, SENIOR_CELL→TEAM,
 *                          reparenting to the correct ancestor.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { _id, name, promote } = await req.json();
    if (!_id) return NextResponse.json({ error: "Id is required" }, { status: 400 });

    const group = await Group.findById(_id);
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (promote) {
      if (group.level === "TEAM") {
        return NextResponse.json({ error: "A team is already at the top level" }, { status: 400 });
      }

      let newLevel: string;
      let newParentId: string | null;

      if (group.level === "CELL") {
        // Becomes a senior cell under the team above its current senior cell.
        newLevel = "SENIOR_CELL";
        const parentSenior = group.parentId ? await Group.findById(group.parentId) : null;
        newParentId = parentSenior?.parentId ? String(parentSenior.parentId) : null;
        if (!newParentId) {
          return NextResponse.json({ error: "No parent team to attach to — create a team first" }, { status: 409 });
        }
      } else {
        // SENIOR_CELL → TEAM. Its cells would be orphaned, so block until they move.
        const childCount = await Group.countDocuments({ parentId: _id });
        if (childCount > 0) {
          return NextResponse.json({ error: "Promote or move its cells first" }, { status: 409 });
        }
        newLevel = "TEAM";
        newParentId = null;
      }

      const clash = await Group.findOne({ name: group.name, level: newLevel, _id: { $ne: _id } });
      if (clash) {
        return NextResponse.json({ error: `A ${newLevel.replace("_", " ").toLowerCase()} named "${group.name}" already exists` }, { status: 409 });
      }

      group.level = newLevel;
      group.parentId = newParentId;
      await group.save();
      return NextResponse.json(group, { status: 200 });
    }

    // Rename
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const dup = await Group.findOne({ name: name.trim(), level: group.level, _id: { $ne: _id } });
    if (dup) return NextResponse.json({ error: "That name already exists at this level" }, { status: 409 });

    const oldName = group.name;
    group.name = name.trim();
    await group.save();

    // Members store hierarchy names as strings — cascade so they don't drift.
    const memberField = { TEAM: "team", SENIOR_CELL: "seniorCell", CELL: "cell" }[
      group.level as "TEAM" | "SENIOR_CELL" | "CELL"
    ];
    await Member.updateMany({ [memberField]: oldName }, { $set: { [memberField]: group.name } });

    return NextResponse.json(group, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
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
