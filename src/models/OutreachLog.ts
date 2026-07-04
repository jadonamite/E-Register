import { Schema, model, models } from "mongoose";

/**
 * One call/message attempt against a contact. The append-only log is the source
 * of truth from which a contact's status and next follow-up are derived.
 * Outcomes and dispositions match the flow locked with the CallCenter client.
 */
const OUTCOMES = ["answered", "no_answer", "switched_off", "busy", "wrong_number", "messaged"];
const DISPOSITIONS = ["coming", "not_coming", "call_back_later"];

const OutreachLogSchema = new Schema({
  contactId: { type: Schema.Types.ObjectId, ref: "OutreachContact", required: true, index: true },
  // Caller _id (or "unassigned" before a caller has signed in on the device).
  callerId: { type: String, required: true },
  at: { type: Date, required: true },
  channel: { type: String, enum: ["call", "message"], required: true },
  outcome: { type: String, enum: OUTCOMES, required: true },
  disposition: { type: String, enum: DISPOSITIONS }, // only when reached
  callBackAt: { type: String }, // yyyy-mm-dd, only for call_back_later
  note: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const OutreachLog = models.OutreachLog || model("OutreachLog", OutreachLogSchema);
export default OutreachLog;
