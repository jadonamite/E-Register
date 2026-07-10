import { Schema, model, models } from "mongoose";

/**
 * A one-off program we track attendance for (e.g. "Love Expression"), separate
 * from regular Sunday/Mid-Week services. Its roster is a live join of members
 * plus — when linked — the invitees collated for an outreach event, so the 2000+
 * invitees never enter the Member collection. Adding a future program is just a
 * new Program row; the attendance page renders a button for each active one.
 */
const ProgramSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  // Label shown on the attendance toggle (defaults to name).
  serviceLabel: { type: String, trim: true },
  // Optional source of the invitee roster. Null → members + walk-ins only.
  outreachEventId: { type: Schema.Types.ObjectId, ref: "OutreachEvent", default: null },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Program = models.Program || model("Program", ProgramSchema);
export default Program;
