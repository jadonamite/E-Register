import { Schema, model, models, type Model } from "mongoose";

/**
 * Tiny singleton-ish key/value store for outreach settings that need to live
 * server-side and change at runtime — currently just the admin access code
 * (stored as a scrypt hash under key "admin-code"). One doc per key.
 */
export interface OutreachConfigDoc {
  key: string;
  value: string;
}

const OutreachConfigSchema = new Schema<OutreachConfigDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

const OutreachConfig: Model<OutreachConfigDoc> =
  (models.OutreachConfig as Model<OutreachConfigDoc>) ||
  model<OutreachConfigDoc>("OutreachConfig", OutreachConfigSchema);

export default OutreachConfig;
