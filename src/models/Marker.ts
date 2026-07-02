import { Schema, model, models } from "mongoose";

/**
 * A protocol-staff member who is authorised to mark attendance. Identified on
 * the attendance page by name (dropdown) + PIN. The PIN is stored hashed.
 */
const MarkerSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  pinHash: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Marker = models.Marker || model("Marker", MarkerSchema);
export default Marker;
