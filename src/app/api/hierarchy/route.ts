import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HierarchyNode from "@/models/HierarchyNode";
import Member from "@/models/Member";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

// Top-to-bottom order of the chain: Zone ⊃ Group ⊃ Chapter ⊃ PCF ⊃ Team ⊃ Senior Cell ⊃ Cell.
const LEVEL_ORDER = ["ZONE", "GROUP", "CHAPTER", "PCF", "TEAM", "SENIOR_CELL", "CELL"] as const;
type Level = (typeof LEVEL_ORDER)[number];

// The level each node must sit under (null = top of the tree).
const PARENT_LEVEL: Record<Level, Level | null> = {
  ZONE: null,
  GROUP: "ZONE",
  CHAPTER: "GROUP",
  PCF: "CHAPTER",
  TEAM: "PCF",
  SENIOR_CELL: "TEAM",
  CELL: "SENIOR_CELL",
};

// Member fields each level's rename cascades into.
const MEMBER_FIELD: Record<Level, string> = {
  ZONE: "zone",
  GROUP: "group",
  CHAPTER: "chapter",
  PCF: "pcf",
  TEAM: "team",
  SENIOR_CELL: "seniorCell",
  CELL: "cell",
};

/** GET — the full structure tree (read by the admin builder and the member form). */
export async function GET() {
  try {
    await connectDB();
    const nodes = await HierarchyNode.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(nodes, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to load structure" }, { status: 500 });
  }
}

/** POST — exec only. Create a node at any level (parent validated). */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { name, level, parentId, code } = await req.json();

    if (!name?.trim() || !LEVEL_ORDER.includes(level)) {
      return NextResponse.json({ error: "Name and level are required" }, { status: 400 });
    }

    const needParent = PARENT_LEVEL[level as Level];
    if (needParent) {
      if (!parentId) {
        return NextResponse.json(
          { error: `A ${level.replace("_", " ").toLowerCase()} needs a parent` },
          { status: 400 }
        );
      }
      const parent = await HierarchyNode.findById(parentId);
      if (!parent || parent.level !== needParent) {
        return NextResponse.json({ error: "Invalid parent for this level" }, { status: 400 });
      }
    }

    const finalParentId = needParent ? parentId : null;
    const exists = await HierarchyNode.findOne({ name: name.trim(), level, parentId: finalParentId });
    if (exists) return NextResponse.json({ error: "That name already exists at this level" }, { status: 409 });

    const node = await HierarchyNode.create({
      name: name.trim(),
      level,
      parentId: finalParentId,
      code: level === "TEAM" && code?.trim() ? code.trim().toUpperCase() : null,
    });
    return NextResponse.json(node, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

/**
 * PATCH — exec only. Three actions:
 *   { _id, name }             → rename (propagates to the member-form tree)
 *   { _id, promote: true }    → lift one level up the chain, reparenting to
 *                               the correct grandparent (blocked if it has
 *                               children, since those would be orphaned).
 *   { _id, newParentId }      → reparent without changing level (e.g. move an
 *                               existing Team under a newly-created PCF).
 *   { _id, code }             → set/clear a Team's stable code.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { _id, name, promote, newParentId, code } = await req.json();
    if (!_id) return NextResponse.json({ error: "Id is required" }, { status: 400 });

    const node = await HierarchyNode.findById(_id);
    if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (promote) {
      const idx = LEVEL_ORDER.indexOf(node.level as Level);
      if (idx <= 0) {
        return NextResponse.json({ error: "Already at the top level" }, { status: 400 });
      }

      const childCount = await HierarchyNode.countDocuments({ parentId: _id });
      if (childCount > 0) {
        return NextResponse.json({ error: "Promote or move its children first" }, { status: 409 });
      }

      const newLevel = LEVEL_ORDER[idx - 1];
      const grandparent = node.parentId ? await HierarchyNode.findById(node.parentId) : null;
      const newParent = grandparent?.parentId ? await HierarchyNode.findById(grandparent.parentId) : null;
      const resolvedParentId = PARENT_LEVEL[newLevel] ? (newParent ? String(newParent._id) : null) : null;

      if (PARENT_LEVEL[newLevel] && !resolvedParentId) {
        return NextResponse.json(
          { error: `No parent ${PARENT_LEVEL[newLevel]!.replace("_", " ").toLowerCase()} to attach to — create one first` },
          { status: 409 }
        );
      }

      const clash = await HierarchyNode.findOne({
        name: node.name,
        level: newLevel,
        parentId: resolvedParentId,
        _id: { $ne: _id },
      });
      if (clash) {
        return NextResponse.json(
          { error: `A ${newLevel.replace("_", " ").toLowerCase()} named "${node.name}" already exists there` },
          { status: 409 }
        );
      }

      node.level = newLevel;
      node.parentId = resolvedParentId;
      await node.save();
      return NextResponse.json(node, { status: 200 });
    }

    if (newParentId !== undefined) {
      const requiredParentLevel = PARENT_LEVEL[node.level as Level];
      if (!requiredParentLevel) {
        return NextResponse.json({ error: "This level has no parent to change" }, { status: 400 });
      }
      const parent = await HierarchyNode.findById(newParentId);
      if (!parent || parent.level !== requiredParentLevel) {
        return NextResponse.json({ error: "Invalid parent for this level" }, { status: 400 });
      }
      const clash = await HierarchyNode.findOne({
        name: node.name,
        level: node.level,
        parentId: newParentId,
        _id: { $ne: _id },
      });
      if (clash) {
        return NextResponse.json({ error: "That name already exists under this parent" }, { status: 409 });
      }
      node.parentId = newParentId;
      await node.save();
      return NextResponse.json(node, { status: 200 });
    }

    if (code !== undefined) {
      if (node.level !== "TEAM") {
        return NextResponse.json({ error: "Only a Team can have a code" }, { status: 400 });
      }
      node.code = code?.trim() ? code.trim().toUpperCase() : null;
      await node.save();
      return NextResponse.json(node, { status: 200 });
    }

    // Rename
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const dup = await HierarchyNode.findOne({
      name: name.trim(),
      level: node.level,
      parentId: node.parentId,
      _id: { $ne: _id },
    });
    if (dup) return NextResponse.json({ error: "That name already exists at this level" }, { status: 409 });

    const oldName = node.name;
    node.name = name.trim();
    await node.save();

    // Members store hierarchy names as strings — cascade so they don't drift.
    const memberField = MEMBER_FIELD[node.level as Level];
    await Member.updateMany({ [memberField]: oldName }, { $set: { [memberField]: node.name } });

    return NextResponse.json(node, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/** DELETE — exec only. Blocked if the node still has sub-nodes. */
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") return forbidden();

    await connectDB();
    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: "Node id required" }, { status: 400 });

    const children = await HierarchyNode.countDocuments({ parentId: _id });
    if (children > 0) {
      return NextResponse.json({ error: "Remove its sub-nodes first" }, { status: 409 });
    }

    await HierarchyNode.findByIdAndDelete(_id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
