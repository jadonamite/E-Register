import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import OutreachConfig from "@/models/OutreachConfig";

interface GroupStats {
  groupName: string;
  total: number;
  early: number;
  onTime: number;
  late: number;
  absent: number;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service") || "Sunday";
    const date = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date();
    const groupBy = (searchParams.get("groupBy") || "cell") as "cell" | "team";

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
    const allMembers = await Member.find({ status: "Member" });

    // Fetch attendance for this date/service
    const attendedMembers = await Member.aggregate([
      { $match: { "attendance.serviceType": service, status: "Member" } },
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
          team: 1,
          markedAt: "$attendance.markedAt",
        },
      },
    ]);

    // Build stats by group
    const groupMap = new Map<string, GroupStats>();

    // Initialize all groups
    allMembers.forEach((member) => {
      const groupKey = groupBy === "cell" ? member.cell || "Unassigned" : member.team || "Unassigned";
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          groupName: groupKey,
          total: 0,
          early: 0,
          onTime: 0,
          late: 0,
          absent: 0,
        });
      }
      groupMap.get(groupKey)!.total++;
    });

    // Categorize attended members
    attendedMembers.forEach((record) => {
      const groupKey = groupBy === "cell" ? record.cell || "Unassigned" : record.team || "Unassigned";
      const stats = groupMap.get(groupKey);
      if (!stats) return;

      const markedTime = timeToMinutes(
        record.markedAt.getHours().toString().padStart(2, "0") +
          ":" +
          record.markedAt.getMinutes().toString().padStart(2, "0")
      );

      if (markedTime < earlyThreshold) {
        stats.early++;
      } else if (markedTime <= lateThreshold) {
        stats.onTime++;
      } else {
        stats.late++;
      }
    });

    // Calculate absents
    const attendedIds = new Set(attendedMembers.map((m) => m._id.toString()));
    allMembers.forEach((member) => {
      if (!attendedIds.has(member._id.toString())) {
        const groupKey = groupBy === "cell" ? member.cell || "Unassigned" : member.team || "Unassigned";
        const stats = groupMap.get(groupKey);
        if (stats) stats.absent++;
      }
    });

    // Convert to array and sort by on-time percentage (descending)
    const stats = Array.from(groupMap.values())
      .map((s) => ({
        ...s,
        earlyPct: s.total > 0 ? Math.round((s.early / s.total) * 100) : 0,
        onTimePct: s.total > 0 ? Math.round((s.onTime / s.total) * 100) : 0,
        latePct: s.total > 0 ? Math.round((s.late / s.total) * 100) : 0,
        absentPct: s.total > 0 ? Math.round((s.absent / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.onTimePct - a.onTimePct);

    return NextResponse.json({
      service,
      date: date.toISOString().split("T")[0],
      earlyThreshold: earlyDoc?.value || "08:00",
      lateThreshold: lateDoc?.value || "09:30",
      groupBy,
      stats,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
