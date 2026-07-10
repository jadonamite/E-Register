import { Schema, model, models } from "mongoose";

/**
 * A single check-in at a program, keyed by phone so members, outreach invitees,
 * and untracked walk-ins all record the same way without any of them needing a
 * Member document. Program attendance is deliberately kept out of
 * Member.attendance so regular-service analytics stay clean.
 *
 * The (programId, phone, date) unique index makes a mark idempotent — re-sending
 * is safe, which keeps the door open for the same offline queue used elsewhere.
 */
const ProgramAttendanceSchema = new Schema({
  programId: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
  date: { type: Date, required: true },
  phone: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  // Where this attendee came from in the roster join.
  source: { type: String, enum: ["member", "contact", "walkin"], required: true },
  // Provenance when known (absent for walk-ins).
  memberId: { type: Schema.Types.ObjectId, ref: "Member" },
  contactId: { type: Schema.Types.ObjectId, ref: "OutreachContact" },
  markedBy: { type: String },
  markedAt: { type: Date, default: Date.now },
});

// One check-in per person per program per day — the idempotency + dedupe key.
ProgramAttendanceSchema.index({ programId: 1, phone: 1, date: 1 }, { unique: true });

const ProgramAttendance =
  models.ProgramAttendance || model("ProgramAttendance", ProgramAttendanceSchema);
export default ProgramAttendance;
