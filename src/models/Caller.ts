import { Schema, model, models } from "mongoose";

/**
 * A volunteer who works the phones for outreach. Admin-created (name + 4-digit
 * PIN); the caller enters their PIN once per device and every log auto-carries
 * their id. The PIN is stored hashed (scrypt, see lib/pin) — mirrors Marker.
 */
const CallerSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  pinHash: { type: String, required: true },
  active: { type: Boolean, default: true },
  // Optional senior-cell assignment: scopes this caller's /contacts queue to
  // that senior cell only. Unassigned = all-access. seniorCellName is
  // denormalised so the roster/sign-in never needs a Group join.
  seniorCellId: { type: Schema.Types.ObjectId, ref: "Group" },
  seniorCellName: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const Caller = models.Caller || model("Caller", CallerSchema);
export default Caller;
