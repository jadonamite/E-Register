import { Schema, model, models } from "mongoose";

/**
 * One record per Sunday: how the service was actually run that week — a single
 * combined window, or separate PS/BG windows with their own times. Created by
 * whichever marker opens the pfcc page first that Sunday ("initializes" it);
 * a marker can later adjust it (e.g. a team didn't run) before or during marking.
 *
 * `windows[].team` always uses the stable Group `code` ("PS"/"BG"), never the
 * renamable `name` — combined mode stores a single window with team "ALL" so
 * every reader can treat `windows` uniformly instead of branching on `mode`.
 */
const ServiceSessionSchema = new Schema({
  date: { type: Date, required: true, unique: true },
  mode: { type: String, enum: ["combined", "separate"], required: true },
  windows: [
    {
      team: { type: String, enum: ["PS", "BG", "ALL"], required: true },
      start: { type: String, required: true },
      end: { type: String, default: null },
      _id: false,
    },
  ],
  initializedBy: { type: Schema.Types.ObjectId, ref: "Marker", required: true },
  initializedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "Marker", default: null },
  updatedAt: { type: Date, default: null },
});

const ServiceSession = models.ServiceSession || model("ServiceSession", ServiceSessionSchema);
export default ServiceSession;
