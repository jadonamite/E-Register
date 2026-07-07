/**
 * Reconcile member hierarchy strings against the admin structure (Group tree).
 *
 * The cell is the source of truth: each member's cell name is matched against
 * the CELL nodes (case-insensitive, "<name> Cell" suffix tolerated), and their
 * team + seniorCell + cell strings are rewritten from the tree. Members whose
 * cell cannot be matched are reported and left untouched.
 *
 *   npx tsx scripts/reconcile-hierarchy.ts           # dry run (default)
 *   npx tsx scripts/reconcile-hierarchy.ts --apply   # write the corrections
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

// One-off spellings that can't be derived mechanically.
const ALIASES: Record<string, string> = {
  "virtuous cell": "CEPC",
  "manifestation": "Manifestations",
  "life changer's": "Life changers",
  "god's kind": "Godkind",
};

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing from .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const groups = await db.collection("groups").find({}).toArray();
  const byId = new Map(groups.map((g) => [g._id.toString(), g]));

  // cell name (lowercase) → canonical { team, seniorCell, cell }
  const chains = new Map<string, { team: string; seniorCell: string; cell: string }>();
  for (const cell of groups.filter((g) => g.level === "CELL")) {
    const sc = cell.parentId && byId.get(cell.parentId.toString());
    const team = sc?.parentId && byId.get(sc.parentId.toString());
    if (!sc || !team) {
      console.warn(`⚠ structure: cell "${cell.name}" has a broken parent chain — skipped`);
      continue;
    }
    chains.set(cell.name.toLowerCase(), { team: team.name, seniorCell: sc.name, cell: cell.name });
  }

  const resolve = (raw: string | null | undefined) => {
    if (!raw?.trim()) return null;
    const key = raw.trim().toLowerCase();
    return (
      chains.get(key) ??
      chains.get(ALIASES[key]?.toLowerCase() ?? "") ??
      chains.get(key.replace(/\s+cell$/, "")) ??
      null
    );
  };

  const members = await db.collection("members").find({}).toArray();
  let fixed = 0;
  const unmatched: string[] = [];

  for (const m of members) {
    const chain = resolve(m.cell);
    if (!chain) {
      // First-timers legitimately have no cell yet; only flag records that claim one.
      if (m.cell?.trim()) unmatched.push(`${m.name} — cell "${m.cell}" not in structure`);
      continue;
    }
    if (m.team === chain.team && m.seniorCell === chain.seniorCell && m.cell === chain.cell) continue;

    console.log(
      `${apply ? "FIX" : "would fix"}: ${m.name}\n` +
        `   ${m.team || "∅"} / ${m.seniorCell || "∅"} / ${m.cell || "∅"}\n` +
        `   → ${chain.team} / ${chain.seniorCell} / ${chain.cell}`
    );
    fixed++;
    if (apply) {
      await db.collection("members").updateOne({ _id: m._id }, { $set: chain });
    }
  }

  console.log(`\n${apply ? "Corrected" : "Would correct"} ${fixed} of ${members.length} members.`);
  if (unmatched.length) {
    console.log(`\nUnmatched (left untouched):`);
    unmatched.forEach((u) => console.log(`  ✗ ${u}`));
  }
  if (!apply && fixed > 0) console.log("\nRe-run with --apply to write these corrections.");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
