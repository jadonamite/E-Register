import { Schema, model, models } from "mongoose";

/**
 * An outreach campaign that feeds a single church event (e.g. "Impact Service").
 * Contacts are collated against it and worked by callers during the campaign
 * window. `status` (live/upcoming/ended) is NOT stored — it is derived from the
 * dates on read (see `eventStatus` in lib/outreach-status), so it can never go
 * stale.
 *
 * Times are stored as ISO strings carrying the Lagos (+01:00) offset exactly as
 * CallCenter composes them, so the wall-clock the admin entered is preserved.
 */
const OutreachEventSchema = new Schema({
  name: { type: String, required: true, trim: true },
  admin: { type: String, required: true, trim: true },
  target: { type: Number, required: true, min: 1 },
  eventStart: { type: String, required: true }, // ISO, +01:00
  eventEnd: { type: String, required: true }, // ISO, +01:00
  campaignStart: { type: String, required: true }, // yyyy-mm-dd
  campaignDays: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: Date.now },
});

const OutreachEvent = models.OutreachEvent || model("OutreachEvent", OutreachEventSchema);
export default OutreachEvent;
