/**
 * Clean caller-pasted noise out of OutreachContact names.
 *
 * Callers pasted numbered rosters ("1. Daniella 090...", "2. Musa 080..."),
 * and two artefacts leaked into the DB:
 *   A) serial prefix stuck to the name  — "14. Emmanuel"  -> "Emmanuel"
 *   B) name landed in `location`, name is serial-only — name "28." / loc
 *      "Timilehin"  ->  name "Timilehin", location cleared
 *
 * Only `name`/`location` are touched — never `phone` or `eventId`, so the
 * unique {eventId, phone} index can't be violated. No inserts, no deletes.
 *
 *   npx tsx scripts/clean-outreach-contacts.ts           # dry run (default)
 *   npx tsx scripts/clean-outreach-contacts.ts --apply   # write the fixes
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const APPLY = process.argv.includes("--apply");

// A leading serial is digits followed by a REAL separator (dot/paren/dash or
// whitespace). Requiring the separator means a nickname like "2Face" is safe.
const SERIAL = /^\s*\d+(?:[.)\-]\s*|\s+)/;
const stripSerial = (s: string) => s.replace(SERIAL, "").trim();

interface Doc {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  location?: string | null;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri, { bufferCommands: false });
  const col = mongoose.connection.collection<Doc>("outreachcontacts");

  const digitNamed = await col.find({ name: { $regex: "\\d" } }).toArray();

  const fixName: { _id: mongoose.Types.ObjectId; before: string; after: string }[] = [];
  const fromLoc: { _id: mongoose.Types.ObjectId; before: string; loc: string; after: string }[] = [];
  const stranded: Doc[] = []; // serial-only name, no usable location
  const flag: string[] = []; // moved-in names that still look odd (e.g. "*")

  for (const d of digitNamed) {
    if (!SERIAL.test(d.name)) continue; // non-serial digit names: leave (manual)
    const stripped = stripSerial(d.name);
    if (stripped.length >= 2) {
      fixName.push({ _id: d._id, before: d.name, after: stripped });
      continue;
    }
    // name is serial-only -> recover from location
    const loc = stripSerial((d.location ?? "").trim());
    if (loc.length >= 2) {
      fromLoc.push({ _id: d._id, before: d.name, loc: d.location ?? "", after: loc });
      if (/[^a-z '.-]/i.test(loc)) flag.push(`${JSON.stringify(d.location)} -> name ${JSON.stringify(loc)}`);
    } else {
      stranded.push(d);
    }
  }

  // Genuine multi-name blobs (no digit, but a comma list in the name).
  const blobs = await col.find({ name: { $regex: "," } }).toArray();

  console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} — outreach contact cleanup\n`);
  console.log(`A) strip serial prefix .......... ${fixName.length}`);
  console.log(`B) name recovered from location . ${fromLoc.length}`);
  console.log(`   stranded (serial name, no loc) ${stranded.length}`);
  console.log(`   multi-name blobs (manual) ..... ${blobs.length}`);

  console.log(`\n-- A: name fixes (first 8) --`);
  fixName.slice(0, 8).forEach((f) => console.log(`   ${JSON.stringify(f.before)} -> ${JSON.stringify(f.after)}`));
  console.log(`\n-- B: from location (first 8) --`);
  fromLoc.slice(0, 8).forEach((f) => console.log(`   name ${JSON.stringify(f.before)} / loc ${JSON.stringify(f.loc)} -> ${JSON.stringify(f.after)}`));
  if (flag.length) { console.log(`\n-- B needs eyes (non-letter chars) --`); flag.forEach((s) => console.log("   " + s)); }
  if (stranded.length) { console.log(`\n-- stranded (left as-is) --`); stranded.forEach((d) => console.log(`   name ${JSON.stringify(d.name)} loc ${JSON.stringify(d.location ?? null)} ph ${d.phone}`)); }
  if (blobs.length) { console.log(`\n-- multi-name blobs (left as-is, manual) --`); blobs.forEach((d) => console.log(`   ${JSON.stringify(d.name)} ph ${d.phone}`)); }

  if (!APPLY) { console.log(`\nDry run only. Re-run with --apply to write.\n`); await mongoose.disconnect(); return; }

  const ops = [
    ...fixName.map((f) => ({ updateOne: { filter: { _id: f._id }, update: { $set: { name: f.after } } } })),
    ...fromLoc.map((f) => ({ updateOne: { filter: { _id: f._id }, update: { $set: { name: f.after }, $unset: { location: "" } } } })),
  ];
  if (ops.length) {
    const res = await col.bulkWrite(ops, { ordered: false });
    console.log(`\nWrote: ${res.modifiedCount} modified.\n`);
  }
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
