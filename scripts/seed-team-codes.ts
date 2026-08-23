/**
 * One-time seed: set the stable `code` on the Team-level Group nodes that
 * Sunday service sessions reference. Idempotent — safe to re-run.
 *
 *   npx tsx scripts/seed-team-codes.ts
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const TEAM_CODES: Record<string, string> = {
  "Pace Setters": "PS",
  "Boundless Grace": "BG",
  "FUTA TWO": "FUTA_TWO",
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  for (const [name, code] of Object.entries(TEAM_CODES)) {
    const result = await db
      .collection("groups")
      .updateOne({ name, level: "TEAM" }, { $set: { code } });
    if (result.matchedCount === 0) {
      console.warn(`⚠ no TEAM named "${name}" found — skipped`);
    } else {
      console.log(`✓ ${name} → code "${code}"`);
    }
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
