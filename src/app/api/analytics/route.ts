import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const members = await Member.find({}).lean();
    
    const totalMembers = members.length;

    // 1. FIRST TIMERS (30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const firstTimers = members.filter((m: any) => 
      new Date(m.createdAt) > thirtyDaysAgo
    ).length;

    // 2. RETENTION RISK (Absent 2 weeks)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const riskList = members.filter((m: any) => {
      if (!m.attendance || m.attendance.length === 0) return true;
      const lastSeen = new Date(Math.max(...m.attendance.map((a: any) => new Date(a.date).getTime())));
      return lastSeen < twoWeeksAgo;
    });

    // 3. HIERARCHY & TREND AGGREGATION
    const cellStats: Record<string, number> = {};
    const teamStats: Record<string, number> = {};
    const roleStats: Record<string, number> = {};
    const attendanceMap: Record<string, number> = {};

    members.forEach((m: any) => {
      // Cell Distribution
      const cell = m.cell || "Unknown";
      cellStats[cell] = (cellStats[cell] || 0) + 1;

      // Team Distribution (New)
      const team = m.team || "No Team";
      teamStats[team] = (teamStats[team] || 0) + 1;

      // Role Distribution (New)
      const role = m.role || "Member";
      roleStats[role] = (roleStats[role] || 0) + 1;

      // Attendance History
      m.attendance?.forEach((a: any) => {
        const dateKey = new Date(a.date).toISOString().split('T')[0];
        attendanceMap[dateKey] = (attendanceMap[dateKey] || 0) + 1;
      });
    });

    const trend = Object.entries(attendanceMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);

    return NextResponse.json({
      totalMembers,
      firstTimers,
      riskCount: riskList.length,
      riskList: riskList.slice(0, 10), // Send top 10 for the dashboard list
      cellStats,
      teamStats,
      roleStats,
      trend
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}