import HierarchyNode from "@/models/HierarchyNode";

export interface CellChain {
  zone: string;
  group: string;
  chapter: string;
  pcf: string;
  team: string;
  seniorCell: string;
  cell: string;
}

function exactCaseInsensitive(name: string) {
  return new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

/**
 * Resolve a cell name (case-insensitive) to its canonical chain in the admin
 * structure. The cell is the source of truth: every ancestor is always
 * derived from the HierarchyNode tree, never trusted from client input.
 * Returns null when the cell doesn't exist or its parent chain is broken
 * (i.e. doesn't reach all the way up to a Zone).
 */
export async function resolveCellChain(cellName: string): Promise<CellChain | null> {
  if (!cellName?.trim()) return null;
  const cell = await HierarchyNode.findOne({ level: "CELL", name: exactCaseInsensitive(cellName) }).lean();
  if (!cell) return null;

  const chain: any[] = [cell];
  let current: any = cell;
  while (current.parentId) {
    current = await HierarchyNode.findById(current.parentId).lean();
    if (!current) return null; // broken parent chain
    chain.push(current);
  }
  if (chain.length !== 7) return null; // must reach Zone

  const [c, seniorCell, team, pcf, chapter, group, zone] = chain;
  return {
    cell: c.name,
    seniorCell: seniorCell.name,
    team: team.name,
    pcf: pcf.name,
    chapter: chapter.name,
    group: group.name,
    zone: zone.name,
  };
}
