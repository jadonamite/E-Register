import { Schema, model, models } from "mongoose";

/**
 * A single node in the church structure tree:
 *   Zone ⊃ Group ⊃ Chapter ⊃ PCF ⊃ Team ⊃ Senior Cell ⊃ Cell
 * Each node points at its parent, so a level can be registered on its own
 * (e.g. a Team before it has any cells) and a rename propagates automatically.
 *
 * Model name is `HierarchyNode` (not `Group`) so it doesn't collide with the
 * "Group" tier in the chain above — but the collection stays named `groups`
 * (pinned below) so no data migration is needed for the rename itself.
 */
const HierarchyNodeSchema = new Schema({
  name: { type: String, required: true, trim: true },
  level: {
    type: String,
    enum: ["ZONE", "GROUP", "CHAPTER", "PCF", "TEAM", "SENIOR_CELL", "CELL"],
    required: true,
  },
  parentId: { type: Schema.Types.ObjectId, ref: "HierarchyNode", default: null },
  // Stable identifier for a Team (e.g. "PS", "BG") that other features (like
  // Sunday service sessions) reference instead of the renamable `name`.
  code: { type: String, trim: true, uppercase: true, default: null },
  createdAt: { type: Date, default: Date.now },
});

// A name only needs to be unique among siblings under the same parent (e.g.
// two different PCFs can each have their own "Pace Setters" team).
HierarchyNodeSchema.index({ name: 1, level: 1, parentId: 1 }, { unique: true });

const HierarchyNode = models.HierarchyNode || model("HierarchyNode", HierarchyNodeSchema, "groups");
export default HierarchyNode;
