import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface CellStats {
  name: string;
  registered: number;
  attended: number;
  percentage: number;
  noShows: any[];
  firstTimers: number;
}

interface SeniorCellStats {
  name: string;
  registered: number;
  attended: number;
  percentage: number;
  cells: CellStats[];
}

interface TeamStats {
  name: string;
  registered: number;
  attended: number;
  percentage: number;
  seniorCells: SeniorCellStats[];
}

interface HierarchyKey {
  team: string;
  seniorCell: string;
  cell: string;
}

// Constants for hierarchy defaults
const HIERARCHY_DEFAULTS = {
  team: "No Team",
  seniorCell: "Unassigned",
  cell: "Unassigned",
} as const;

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getEndOfWeek(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
}

function getHierarchyKey(member: any): string {
  const team = member.team || HIERARCHY_DEFAULTS.team;
  const seniorCell = member.seniorCell || HIERARCHY_DEFAULTS.seniorCell;
  const cell = member.cell || HIERARCHY_DEFAULTS.cell;
  return `${team}::${seniorCell}::${cell}`;
}

function parseHierarchyKey(key: string): HierarchyKey {
  const [team, seniorCell, cell] = key.split("::");
  return { team, seniorCell, cell };
}

function validateDateParams(
  startDateParam: string | null,
  endDateParam: string | null
): { start: Date; end: Date } | { error: string } {
  if (!startDateParam || !endDateParam) return { start: new Date(0), end: new Date(0) }; // Signals use defaults

  try {
    const start = new Date(startDateParam);
    const end = new Date(endDateParam);

    if (isNaN(start.getTime())) {
      return { error: `Invalid startDate: ${startDateParam}. Expected ISO date (YYYY-MM-DD)` };
    }
    if (isNaN(end.getTime())) {
      return { error: `Invalid endDate: ${endDateParam}. Expected ISO date (YYYY-MM-DD)` };
    }
    if (start > end) {
      return { error: "startDate must be before endDate" };
    }

    end.setHours(23, 59, 59, 999);
    return { start, end };
  } catch (e) {
    return { error: `Date parsing error: ${(e as Error).message}` };
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const serviceType = searchParams.get("serviceType");

    // Validate and parse dates
    const dateValidation = validateDateParams(startDateParam, endDateParam);
    if ("error" in dateValidation) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    let startDate: Date, endDate: Date;

    if (dateValidation.start.getTime() === 0) {
      // Use default (this week)
      const today = new Date();
      startDate = getStartOfWeek(today);
      endDate = getEndOfWeek(startDate);
    } else {
      startDate = dateValidation.start;
      endDate = dateValidation.end;
    }

    // Previous week for comparison
    const prevWeekEnd = new Date(startDate);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const prevWeekStart = getStartOfWeek(prevWeekEnd);

    // FETCH DATA
    const allMembers = await Member.find({ status: "Member" }).lean();

    const thisWeekAttendance = await Member.aggregate([
      { $match: { status: "Member" } },
      { $unwind: "$attendance" },
      {
        $match: {
          "attendance.date": { $gte: startDate, $lte: endDate },
          ...(serviceType && { "attendance.serviceType": serviceType }),
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          cell: 1,
          seniorCell: 1,
          team: 1,
          role: 1,
          attendance: 1,
        },
      },
    ]);

    const prevWeekAttendance = await Member.aggregate([
      { $match: { status: "Member" } },
      { $unwind: "$attendance" },
      {
        $match: {
          "attendance.date": { $gte: prevWeekStart, $lte: prevWeekEnd },
          ...(serviceType && { "attendance.serviceType": serviceType }),
        },
      },
      {
        $project: { _id: 1 },
      },
    ]);

    // Fetch first-timers who ATTENDED this week (not by createdAt)
    const firstTimersThisWeek = await Member.aggregate([
      { $match: { status: "FirstTimer" } },
      { $unwind: "$attendance" },
      {
        $match: {
          "attendance.date": { $gte: startDate, $lte: endDate },
          ...(serviceType && { "attendance.serviceType": serviceType }),
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          cell: { $first: "$cell" },
          team: { $first: "$team" },
          seniorCell: { $first: "$seniorCell" },
          invitedBy: { $first: "$invitedBy" },
        },
      },
    ]);

    const thisWeekAttendeeIds = new Set(thisWeekAttendance.map((a) => a._id.toString()));
    const prevWeekCount = prevWeekAttendance.length;
    const thisWeekCount = thisWeekAttendance.length;
    const weekChange = thisWeekCount - prevWeekCount;

    // BUILD HIERARCHY - O(n)
    const teamMap = new Map<string, TeamStats>();

    allMembers.forEach((member) => {
      const teamName = member.team || HIERARCHY_DEFAULTS.team;
      const seniorCellName = member.seniorCell || HIERARCHY_DEFAULTS.seniorCell;
      const cellName = member.cell || HIERARCHY_DEFAULTS.cell;

      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          name: teamName,
          registered: 0,
          attended: 0,
          percentage: 0,
          seniorCells: [],
        });
      }

      const team = teamMap.get(teamName)!;
      team.registered++;

      let seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
      if (!seniorCell) {
        seniorCell = {
          name: seniorCellName,
          registered: 0,
          attended: 0,
          percentage: 0,
          cells: [],
        };
        team.seniorCells.push(seniorCell);
      }
      seniorCell.registered++;

      let cell = seniorCell.cells.find((c) => c.name === cellName);
      if (!cell) {
        cell = {
          name: cellName,
          registered: 0,
          attended: 0,
          percentage: 0,
          noShows: [],
          firstTimers: 0,
        };
        seniorCell.cells.push(cell);
      }
      cell.registered++;
    });

    // COUNT ATTENDANCE - O(m)
    thisWeekAttendance.forEach((attendance) => {
      const teamName = attendance.team || HIERARCHY_DEFAULTS.team;
      const seniorCellName = attendance.seniorCell || HIERARCHY_DEFAULTS.seniorCell;
      const cellName = attendance.cell || HIERARCHY_DEFAULTS.cell;

      const team = teamMap.get(teamName);
      if (team) {
        team.attended++;
        const seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
        if (seniorCell) {
          seniorCell.attended++;
          const cell = seniorCell.cells.find((c) => c.name === cellName);
          if (cell) {
            cell.attended++;
          }
        }
      }
    });

    // CALCULATE NO-SHOWS (OPTIMIZED) - O(n + m) instead of O(n*m*t)
    const membersByCell = new Map<string, any[]>();
    const attendeesByCell = new Map<string, Set<string>>();

    // Build lookup map of members by cell - O(n)
    allMembers.forEach((member) => {
      const key = getHierarchyKey(member);
      if (!membersByCell.has(key)) {
        membersByCell.set(key, []);
      }
      membersByCell.get(key)!.push(member);
    });

    // Build lookup map of attendees by cell - O(m)
    thisWeekAttendance.forEach((attendance) => {
      const key = getHierarchyKey(attendance);
      if (!attendeesByCell.has(key)) {
        attendeesByCell.set(key, new Set());
      }
      attendeesByCell.get(key)!.add(attendance._id.toString());
    });

    // Calculate no-shows - O(n)
    const allNoShows: any[] = [];
    membersByCell.forEach((members, cellKey) => {
      const attendees = attendeesByCell.get(cellKey) || new Set();
      const hierarchy = parseHierarchyKey(cellKey);

      members.forEach((member) => {
        if (!attendees.has(member._id.toString())) {
          allNoShows.push({
            _id: member._id,
            name: member.name,
            role: member.role || "Member",
            cell: hierarchy.cell,
            seniorCell: hierarchy.seniorCell,
            team: hierarchy.team,
          });
        }
      });
    });

    // Populate no-shows back into hierarchy
    allNoShows.forEach((noShow) => {
      const team = teamMap.get(noShow.team);
      if (team) {
        const seniorCell = team.seniorCells.find((sc) => sc.name === noShow.seniorCell);
        if (seniorCell) {
          const cell = seniorCell.cells.find((c) => c.name === noShow.cell);
          if (cell) {
            cell.noShows.push(noShow);
          }
        }
      }
    });

    // COUNT FIRST-TIMERS PER CELL
    firstTimersThisWeek.forEach((ft) => {
      const teamName = ft.team || HIERARCHY_DEFAULTS.team;
      const seniorCellName = ft.seniorCell || HIERARCHY_DEFAULTS.seniorCell;
      const cellName = ft.cell || HIERARCHY_DEFAULTS.cell;

      const team = teamMap.get(teamName);
      if (team) {
        const seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
        if (seniorCell) {
          const cell = seniorCell.cells.find((c) => c.name === cellName);
          if (cell) {
            cell.firstTimers++;
          }
        }
      }
    });

    // CALCULATE PERCENTAGES & SORT
    teamMap.forEach((team) => {
      team.percentage = team.registered > 0 ? Math.round((team.attended / team.registered) * 100) : 0;

      team.seniorCells.forEach((seniorCell) => {
        seniorCell.percentage = seniorCell.registered > 0 ? Math.round((seniorCell.attended / seniorCell.registered) * 100) : 0;

        seniorCell.cells.forEach((cell) => {
          cell.percentage = cell.registered > 0 ? Math.round((cell.attended / cell.registered) * 100) : 0;
        });

        seniorCell.cells.sort((a, b) => b.percentage - a.percentage);
      });

      team.seniorCells.sort((a, b) => b.percentage - a.percentage);
    });

    const teams = Array.from(teamMap.values()).sort((a, b) => b.percentage - a.percentage);

    // Separate "Unassigned" for clarity (if present)
    const unassignedTeamIndex = teams.findIndex((t) => t.name === HIERARCHY_DEFAULTS.team);
    let unassignedTeam = null;
    if (unassignedTeamIndex !== -1) {
      unassignedTeam = teams.splice(unassignedTeamIndex, 1)[0];
    }

    return NextResponse.json({
      weekRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      summary: {
        totalAttendance: thisWeekCount,
        totalFirstTimers: firstTimersThisWeek.length,
        weekVsLastWeek: {
          thisWeek: thisWeekCount,
          lastWeek: prevWeekCount,
          change: weekChange,
          percentageChange: prevWeekCount > 0 ? Math.round((weekChange / prevWeekCount) * 100) : 0,
        },
      },
      teams,
      unassignedTeam, // Separate section for members without proper hierarchy
      noShows: allNoShows,
      firstTimers: firstTimersThisWeek,
      _meta: {
        queryTime: Date.now(),
        totalMembers: allMembers.length,
        dataQualityIssues: {
          unassignedCount: unassignedTeam?.registered || 0,
          unassignedMessage:
            unassignedTeam && unassignedTeam.registered > 0
              ? `${unassignedTeam.registered} members lack proper team/senior cell/cell assignment`
              : undefined,
        },
      },
    });
  } catch (error) {
    console.error("Weekly accountability error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch weekly accountability",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
