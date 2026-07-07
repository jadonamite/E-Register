import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import OutreachConfig from "@/models/OutreachConfig";

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

interface CellStats {
  name: string;
  total: number;
  early: number;
  onTime: number;
  late: number;
  absent: number;
  earlyPct: number;
  onTimePct: number;
  latePct: number;
  absentPct: number;
}

interface SeniorCellStats {
  name: string;
  total: number;
  early: number;
  onTime: number;
  late: number;
  absent: number;
  earlyPct: number;
  onTimePct: number;
  latePct: number;
  absentPct: number;
  cells: CellStats[];
}

interface TeamStats {
  name: string;
  total: number;
  early: number;
  onTime: number;
  late: number;
  absent: number;
  earlyPct: number;
  onTimePct: number;
  latePct: number;
  absentPct: number;
  seniorCells: SeniorCellStats[];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service") || "Sunday";
    const date = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date();

    await connectDB();

    // Fetch time thresholds
    const earlyDoc = await OutreachConfig.findOne({
      key: `attendance:${service}:earlyThreshold`,
    });
    const lateDoc = await OutreachConfig.findOne({
      key: `attendance:${service}:lateThreshold`,
    });

    const earlyThreshold = timeToMinutes(earlyDoc?.value || "08:00");
    const lateThreshold = timeToMinutes(lateDoc?.value || "09:30");

    // Normalize date to start of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all members (to count absents too)
    const allMembers = await Member.find({ status: { $ne: "FirstTimer" } }).lean();

    // Fetch attendance for this date/service
    const attendedMembers = await Member.aggregate([
      { $match: { "attendance.serviceType": service, status: { $ne: "FirstTimer" } } },
      { $unwind: "$attendance" },
      {
        $match: {
          "attendance.serviceType": service,
          "attendance.date": { $gte: startOfDay, $lte: endOfDay },
          "attendance.markedAt": { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          cell: 1,
          seniorCell: 1,
          team: 1,
          markedAt: "$attendance.markedAt",
        },
      },
    ]);

    // Build hierarchical structure
    const teamMap = new Map<string, TeamStats>();

    // Initialize all teams/senior cells/cells
    allMembers.forEach((member) => {
      const teamName = member.team || "No Team";
      const seniorCellName = member.seniorCell || "Unassigned";
      const cellName = member.cell || "Unassigned";

      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          name: teamName,
          total: 0,
          early: 0,
          onTime: 0,
          late: 0,
          absent: 0,
          earlyPct: 0,
          onTimePct: 0,
          latePct: 0,
          absentPct: 0,
          seniorCells: [],
        });
      }

      const team = teamMap.get(teamName)!;
      team.total++;

      let seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
      if (!seniorCell) {
        seniorCell = {
          name: seniorCellName,
          total: 0,
          early: 0,
          onTime: 0,
          late: 0,
          absent: 0,
          earlyPct: 0,
          onTimePct: 0,
          latePct: 0,
          absentPct: 0,
          cells: [],
        };
        team.seniorCells.push(seniorCell);
      }
      seniorCell.total++;

      let cell = seniorCell.cells.find((c) => c.name === cellName);
      if (!cell) {
        cell = {
          name: cellName,
          total: 0,
          early: 0,
          onTime: 0,
          late: 0,
          absent: 0,
          earlyPct: 0,
          onTimePct: 0,
          latePct: 0,
          absentPct: 0,
        };
        seniorCell.cells.push(cell);
      }
      cell.total++;
    });

    // Categorize attended members
    attendedMembers.forEach((record) => {
      const teamName = record.team || "No Team";
      const seniorCellName = record.seniorCell || "Unassigned";
      const cellName = record.cell || "Unassigned";

      const team = teamMap.get(teamName);
      if (!team) return;

      const markedTime = timeToMinutes(
        record.markedAt.getHours().toString().padStart(2, "0") +
          ":" +
          record.markedAt.getMinutes().toString().padStart(2, "0")
      );

      let category: "early" | "onTime" | "late" = "onTime";
      if (markedTime < earlyThreshold) {
        category = "early";
      } else if (markedTime > lateThreshold) {
        category = "late";
      }

      team[category]++;

      const seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
      if (seniorCell) {
        seniorCell[category]++;

        const cell = seniorCell.cells.find((c) => c.name === cellName);
        if (cell) {
          cell[category]++;
        }
      }
    });

    // Calculate absents and percentages
    const attendedIds = new Set(attendedMembers.map((m) => m._id.toString()));

    allMembers.forEach((member) => {
      if (!attendedIds.has(member._id.toString())) {
        const teamName = member.team || "No Team";
        const seniorCellName = member.seniorCell || "Unassigned";
        const cellName = member.cell || "Unassigned";

        const team = teamMap.get(teamName);
        if (team) {
          team.absent++;

          const seniorCell = team.seniorCells.find((sc) => sc.name === seniorCellName);
          if (seniorCell) {
            seniorCell.absent++;

            const cell = seniorCell.cells.find((c) => c.name === cellName);
            if (cell) {
              cell.absent++;
            }
          }
        }
      }
    });

    // Calculate percentages for all levels
    const calculatePercentages = (stats: any) => {
      if (stats.total > 0) {
        stats.earlyPct = Math.round((stats.early / stats.total) * 100);
        stats.onTimePct = Math.round((stats.onTime / stats.total) * 100);
        stats.latePct = Math.round((stats.late / stats.total) * 100);
        stats.absentPct = Math.round((stats.absent / stats.total) * 100);
      }
    };

    teamMap.forEach((team) => {
      calculatePercentages(team);

      team.seniorCells.forEach((seniorCell) => {
        calculatePercentages(seniorCell);

        seniorCell.cells.forEach((cell) => {
          calculatePercentages(cell);
        });

        // Sort cells by on-time percentage
        seniorCell.cells.sort((a, b) => b.onTimePct - a.onTimePct);
      });

      // Sort senior cells by on-time percentage
      team.seniorCells.sort((a, b) => b.onTimePct - a.onTimePct);
    });

    const teams = Array.from(teamMap.values()).sort((a, b) => b.onTimePct - a.onTimePct);

    return NextResponse.json({
      service,
      date: date.toISOString().split("T")[0],
      earlyThreshold: earlyDoc?.value || "08:00",
      lateThreshold: lateDoc?.value || "09:30",
      teams,
    });
  } catch (error) {
    console.error("Promptness hierarchy error:", error);
    return NextResponse.json({ error: "Failed to compute promptness hierarchy" }, { status: 500 });
  }
}
