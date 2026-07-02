import { Schema, model, models } from "mongoose";

/**
 * A single node in the church structure tree: Team ⊃ Senior Cell ⊃ Cell.
 * Each node points at its parent, so a level can be registered on its own
 * (e.g. a Team before it has any cells) and a rename propagates automatically.
 */
const GroupSchema = new Schema({
  name: { type: String, required: true, trim: true },
  level: {
    type: String,
    enum: ["TEAM", "SENIOR_CELL", "CELL"],
    required: true,
  },
  parentId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
  createdAt: { type: Date, default: Date.now },
});

// No two nodes share a name at the same level.
GroupSchema.index({ name: 1, level: 1 }, { unique: true });

const Group = models.Group || model("Group", GroupSchema);
export default Group;
