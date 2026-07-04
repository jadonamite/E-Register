import { Schema, model, models } from "mongoose";

/**
 * A person invited to an event, attributed to the leaf group (cell) that
 * brought them. A contact's pipeline status is never stored here — it is
 * DERIVED from its OutreachLogs (+ the `doNotContact` exit), keeping call
 * history the single source of truth.
 */
const OutreachContactSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: "OutreachEvent", required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  // Leaf group (cell) credited with bringing this contact — a Group _id.
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  broughtBy: { type: String, required: true, trim: true },
  // Where the contact is coming from — area/address. Optional.
  location: { type: String, trim: true },
  // Exit flag: suppress from the active queue (contact asked not to be reached).
  doNotContact: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// One entry per phone per event — the dedupe key for bulk collation.
OutreachContactSchema.index({ eventId: 1, phone: 1 }, { unique: true });

const OutreachContact =
  models.OutreachContact || model("OutreachContact", OutreachContactSchema);
export default OutreachContact;
