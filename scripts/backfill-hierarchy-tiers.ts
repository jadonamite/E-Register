/**
 * Backfill zone/group/chapter/pcf onto existing Members once the tree above
 * Team has been built out in the admin Structure tab (Zone → Group → Chapter
 * → PCF created, and every existing Team reparented under the correct PCF).
 *
 * team/seniorCell/cell are left untouched — those are already correct from
 * scripts/reconcile-hierarchy.ts; this script's only job is the 4 new tiers.
 *
 * Also syncs the HierarchyNode indexes: the uniqueness rule changed from
 * {name, level} to {name, level, parentId}, so the old index needs dropping
 * before Mongo will allow siblings under different parents to share a name.
 *
 *   npx tsx scripts/backfill-hierarchy-tiers.ts           # dry run (default)
 *   npx tsx scripts/backfill-hierarchy-tiers.ts --apply   # write the corrections
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  if (apply) {
    // Drop the old {name, level} unique index if present so it stops
    // blocking same-named siblings under different parents (e.g. two PCFs
    // each with their own "Pace Setters" team). Safe to run more than once.
    const indexes = await db.collection("groups").indexInformation();
    if (indexes["name_1_level_1"]) {
      await db.collection("groups").dropIndex("name_1_level_1");
      console.log("✓ dropped the old {name, level} unique index");
    }
    await db.collection("groups").createIndex(
      { name: 1, level: 1, parentId: 1 },
      { unique: true }
    );
    console.log("✓ ensured the {name, level, parentId} unique index");
  }

  const nodes = await db.collection("groups").find({}).toArray();
  const byId = new Map(nodes.map((n) => [n._id.toString(), n]));

  // cell name (lowercase) → { zone, group, chapter, pcf }
  const chains = new Map<string, { zone: string; group: string; chapter: string; pcf: string }>();
  for (const cell of nodes.filter((n) => n.level === "CELL")) {
    const chain: any[] = [cell];
    let current: any = cell;
    let broken = false;
    while (current.parentId) {
      current = byId.get(current.parentId.toString());
      if (!current) {
        broken = true;
        break;
      }
      chain.push(current);
    }
    if (broken || chain.length !== 7) {
      console.warn(`⚠ structure: cell "${cell.name}" doesn't reach a Zone — skipped`);
      continue;
    }
    const [, , , pcf, chapter, group, zone] = chain;
    chains.set(cell.name.toLowerCase(), { zone: zone.name, group: group.name, chapter: chapter.name, pcf: pcf.name });
  }

  const members = await db.collection("members").find({}).toArray();
  let fixed = 0;
  const unresolved: string[] = [];

  for (const m of members) {
    if (!m.cell?.trim()) continue; // first-timers with no cell yet — nothing to backfill
    const chain = chains.get(m.cell.trim().toLowerCase());
    if (!chain) {
      unresolved.push(`${m.name} — cell "${m.cell}" not found under a complete Zone chain`);
      continue;
    }
    if (m.zone === chain.zone && m.group === chain.group && m.chapter === chain.chapter && m.pcf === chain.pcf) {
      continue;
    }
    console.log(`${apply ? "FIX" : "would fix"}: ${m.name} → ${chain.zone} / ${chain.group} / ${chain.chapter} / ${chain.pcf}`);
    fixed++;
    if (apply) {
      await db.collection("members").updateOne({ _id: m._id }, { $set: chain });
    }
  }

  console.log(`\n${apply ? "Backfilled" : "Would backfill"} ${fixed} of ${members.length} members.`);
  if (unresolved.length) {
    console.log(`\nUnresolved (left untouched — fix the tree and rerun):`);
    unresolved.forEach((u) => console.log(`  ✗ ${u}`));
  }
  if (!apply && fixed > 0) console.log("\nRe-run with --apply to write these corrections.");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
