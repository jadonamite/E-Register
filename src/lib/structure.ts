import Group from "@/models/Group";

export interface CellChain {
  team: string;
  seniorCell: string;
  cell: string;
}

function exactCaseInsensitive(name: string) {
  return new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

/**
 * Resolve a cell name (case-insensitive) to its canonical chain in the admin
 * structure. The cell is the source of truth: team and senior cell are always
 * derived from the Group tree, never trusted from client input.
 * Returns null when the cell doesn't exist or its parent chain is broken.
 */
export async function resolveCellChain(cellName: string): Promise<CellChain | null> {
  if (!cellName?.trim()) return null;
  const cell = await Group.findOne({ level: "CELL", name: exactCaseInsensitive(cellName) }).lean();
  if (!cell) return null;
  const seniorCell = cell.parentId ? await Group.findById(cell.parentId).lean() : null;
  const team = seniorCell?.parentId ? await Group.findById(seniorCell.parentId).lean() : null;
  if (!seniorCell || !team) return null;
  return { team: team.name, seniorCell: seniorCell.name, cell: cell.name };
}
