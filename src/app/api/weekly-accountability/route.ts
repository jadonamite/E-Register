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
  noShows: NoShow[];
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
  /** Rank positions gained (+) or lost (-) vs the previous week; null when the team had no previous-week data. */
  movement: number | null;
  seniorCells: SeniorCellStats[];
}

interface NoShow {
  _id: string;
  name: string;
  role: string;
  cell: string;
  seniorCell: string;
  team: string;
  /** Consecutive weeks (including this one) with zero attendance, capped at STREAK_WINDOW. */
  weeksAbsent: number;
}

const HIERARCHY_DEFAULTS = {
  team: "No Team",
  seniorCell: "Unassigned",
  cell: "Unassigned",
} as const;

// Services happen in Lagos (UTC+1, no DST); Vercel runs in UTC. Week
// boundaries must be anchored to local midnight or attendance marked late
// Sunday night lands in the wrong week.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
// How far back to look when computing consecutive-absence streaks.
const STREAK_WINDOW = 8;

/**
 * Sunday 00:00 → Saturday 23:59:59.999 of the week containing `now`, in Lagos
 * time. The church week opens with the Sunday service, so weeks start on
 * Sunday — otherwise a Monday view shows 0% until midweek.
 */
function lagosWeekRange(now: Date): { start: Date; end: Date } {
  const local = new Date(now.getTime() + LAGOS_OFFSET_MS);
  const start = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - local.getUTCDay()) -
      LAGOS_OFFSET_MS
  );
  return { start, end: new Date(start.getTime() + WEEK_MS - 1) };
}

function parseLagosDate(param: string, endOfDay: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) return null;
  const d = new Date(`${param}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+01:00`);
  return isNaN(d.getTime()) ? null : d;
}

function hierarchyOf(doc: any) {
  return {
    team: doc.team || HIERARCHY_DEFAULTS.team,
    seniorCell: doc.seniorCell || HIERARCHY_DEFAULTS.seniorCell,
    cell: doc.cell || HIERARCHY_DEFAULTS.cell,
  };
}

/** Unique members (with hierarchy fields) who attended at least once in the range. */
function uniqueAttendees(startDate: Date, endDate: Date, serviceType: string | null) {
  return Member.aggregate([
    { $match: { status: { $ne: "FirstTimer" } } },
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
        seniorCell: { $first: "$seniorCell" },
        team: { $first: "$team" },
        role: { $first: "$role" },
      },
    },
  ]);
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

    let startDate: Date, endDate: Date;
    if (startDateParam || endDateParam) {
      if (!startDateParam || !endDateParam) {
        return NextResponse.json(
          { error: "startDate and endDate must be provided together (YYYY-MM-DD)" },
          { status: 400 }
        );
      }
      const start = parseLagosDate(startDateParam, false);
      const end = parseLagosDate(endDateParam, true);
      if (!start) {
        return NextResponse.json(
          { error: `Invalid startDate: ${startDateParam}. Expected YYYY-MM-DD` },
          { status: 400 }
        );
      }
      if (!end) {
        return NextResponse.json(
          { error: `Invalid endDate: ${endDateParam}. Expected YYYY-MM-DD` },
          { status: 400 }
        );
      }
      if (start > end) {
        return NextResponse.json({ error: "startDate must be before endDate" }, { status: 400 });
      }
      startDate = start;
      endDate = end;
    } else {
      ({ start: startDate, end: endDate } = lagosWeekRange(new Date()));
    }

    const prevWeekEnd = new Date(startDate.getTime() - 1);
    const prevWeekStart = new Date(startDate.getTime() - WEEK_MS);
    const streakStart = new Date(endDate.getTime() - STREAK_WINDOW * WEEK_MS + 1);

    const [allMembers, thisWeekAttendees, prevWeekAttendees, firstTimersThisWeek, streakHistory] =
      await Promise.all([
        Member.find({ status: { $ne: "FirstTimer" } }).lean(),
        uniqueAttendees(startDate, endDate, serviceType),
        uniqueAttendees(prevWeekStart, prevWeekEnd, serviceType),
        // First-timers who attended in the range (not by createdAt).
        Member.aggregate([
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
        ]),
        // Raw check-in dates over the streak window, for consecutive-absence calc.
        Member.aggregate([
          { $match: { status: { $ne: "FirstTimer" } } },
          { $unwind: "$attendance" },
          {
            $match: {
              "attendance.date": { $gte: streakStart, $lte: endDate },
              ...(serviceType && { "attendance.serviceType": serviceType }),
            },
          },
          { $project: { _id: 1, date: "$attendance.date" } },
        ]),
      ]);

    // Which 7-day blocks (0 = the selected week, counting backwards) each member attended.
    const attendedBlocks = new Map<string, Set<number>>();
    streakHistory.forEach((h) => {
      const block = Math.floor((endDate.getTime() - new Date(h.date).getTime()) / WEEK_MS);
      const id = h._id.toString();
      if (!attendedBlocks.has(id)) attendedBlocks.set(id, new Set());
      attendedBlocks.get(id)!.add(block);
    });
    const weeksAbsentFor = (id: string): number => {
      const blocks = attendedBlocks.get(id);
      let weeks = 0;
      while (weeks < STREAK_WINDOW && !blocks?.has(weeks)) weeks++;
      return weeks;
    };

    // BUILD HIERARCHY — one pass over the roster.
    const teamMap = new Map<string, TeamStats>();
    allMembers.forEach((member) => {
      const { team: teamName, seniorCell: seniorCellName, cell: cellName } = hierarchyOf(member);

      let team = teamMap.get(teamName);
      if (!team) {
        team = { name: teamName, registered: 0, attended: 0, percentage: 0, movement: null, seniorCells: [] };
        teamMap.set(teamName, team);
      }
      team.registered++;

      let seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
      if (!seniorCell) {
        seniorCell = { name: seniorCellName, registered: 0, attended: 0, percentage: 0, cells: [] };
        team.seniorCells.push(seniorCell);
      }
      seniorCell.registered++;

      let cell = seniorCell.cells.find((c) => c.name === cellName);
      if (!cell) {
        cell = { name: cellName, registered: 0, attended: 0, percentage: 0, noShows: [], firstTimers: 0 };
        seniorCell.cells.push(cell);
      }
      cell.registered++;
    });

    // COUNT ATTENDANCE — one increment per unique attendee.
    const attendeeIds = new Set(thisWeekAttendees.map((a) => a._id.toString()));
    thisWeekAttendees.forEach((attendee) => {
      const { team: teamName, seniorCell: seniorCellName, cell: cellName } = hierarchyOf(attendee);
      const team = teamMap.get(teamName);
      if (!team) return;
      team.attended++;
      const seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
      if (!seniorCell) return;
      seniorCell.attended++;
      const cell = seniorCell.cells.find((c) => c.name === cellName);
      if (cell) cell.attended++;
    });

    // NO-SHOWS with absence streaks, worst first.
    const allNoShows: NoShow[] = [];
    allMembers.forEach((member) => {
      const id = member._id.toString();
      if (attendeeIds.has(id)) return;
      const hierarchy = hierarchyOf(member);
      allNoShows.push({
        _id: member._id.toString(),
        name: member.name,
        role: member.role || "Member",
        ...hierarchy,
        weeksAbsent: weeksAbsentFor(id),
      });
    });
    allNoShows.sort((a, b) => b.weeksAbsent - a.weeksAbsent);

    allNoShows.forEach((noShow) => {
      const cell = teamMap
        .get(noShow.team)
        ?.seniorCells.find((sc) => sc.name === noShow.seniorCell)
        ?.cells.find((c) => c.name === noShow.cell);
      cell?.noShows.push(noShow);
    });

    // FIRST-TIMERS PER CELL
    firstTimersThisWeek.forEach((ft) => {
      const { team: teamName, seniorCell: seniorCellName, cell: cellName } = hierarchyOf(ft);
      const cell = teamMap
        .get(teamName)
        ?.seniorCells.find((sc) => sc.name === seniorCellName)
        ?.cells.find((c) => c.name === cellName);
      if (cell) cell.firstTimers++;
    });

    // PERCENTAGES & RANKING
    const pct = (attended: number, registered: number) =>
      registered > 0 ? Math.round((attended / registered) * 100) : 0;

    teamMap.forEach((team) => {
      team.percentage = pct(team.attended, team.registered);
      team.seniorCells.forEach((seniorCell) => {
        seniorCell.percentage = pct(seniorCell.attended, seniorCell.registered);
        seniorCell.cells.forEach((cell) => {
          cell.percentage = pct(cell.attended, cell.registered);
        });
        seniorCell.cells.sort((a, b) => b.percentage - a.percentage);
      });
      team.seniorCells.sort((a, b) => b.percentage - a.percentage);
    });

    const teams = Array.from(teamMap.values()).sort((a, b) => b.percentage - a.percentage);

    // RANK MOVEMENT vs previous week (previous-week attendance over the current roster).
    const prevTeamAttended = new Map<string, number>();
    prevWeekAttendees.forEach((attendee) => {
      const teamName = attendee.team || HIERARCHY_DEFAULTS.team;
      prevTeamAttended.set(teamName, (prevTeamAttended.get(teamName) || 0) + 1);
    });
    const prevRanking = teams
      .map((t) => ({ name: t.name, percentage: pct(prevTeamAttended.get(t.name) || 0, t.registered) }))
      .sort((a, b) => b.percentage - a.percentage);
    const prevRank = new Map(prevRanking.map((t, i) => [t.name, i]));
    teams.forEach((team, currentRank) => {
      const prev = prevRank.get(team.name);
      const hadPrevData = (prevTeamAttended.get(team.name) || 0) > 0;
      team.movement = hadPrevData && prev !== undefined ? prev - currentRank : null;
    });

    // Separate "Unassigned" for data-quality visibility.
    const unassignedIndex = teams.findIndex((t) => t.name === HIERARCHY_DEFAULTS.team);
    const unassignedTeam = unassignedIndex !== -1 ? teams.splice(unassignedIndex, 1)[0] : null;

    const thisWeekCount = thisWeekAttendees.length;
    const prevWeekCount = prevWeekAttendees.length;
    const weekChange = thisWeekCount - prevWeekCount;

    return NextResponse.json({
      weekRange: {
        start: new Date(startDate.getTime() + LAGOS_OFFSET_MS).toISOString().split("T")[0],
        end: new Date(endDate.getTime() + LAGOS_OFFSET_MS).toISOString().split("T")[0],
      },
      summary: {
        totalAttendance: thisWeekCount,
        attendanceRate: pct(thisWeekCount, allMembers.length),
        totalRegistered: allMembers.length,
        totalFirstTimers: firstTimersThisWeek.length,
        weekVsLastWeek: {
          thisWeek: thisWeekCount,
          lastWeek: prevWeekCount,
          change: weekChange,
          percentageChange: prevWeekCount > 0 ? Math.round((weekChange / prevWeekCount) * 100) : 0,
        },
      },
      teams,
      unassignedTeam,
      noShows: allNoShows,
      firstTimers: firstTimersThisWeek,
      _meta: {
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
