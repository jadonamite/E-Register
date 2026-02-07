import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const members = await Member.find({}).lean();
    
    // 1. Total Members
    const totalMembers = members.length;

    // 2. FIRST TIMERS (New Members in the last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const firstTimers = members.filter((m: any) => 
      new Date(m.createdAt) > thirtyDaysAgo
    ).length;

    // 3. Retention Risk (Absent for 2 weeks)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const retentionRisk = members.filter((m: any) => {
      if (!m.attendance || m.attendance.length === 0) return true;
      const lastSeen = new Date(Math.max(...m.attendance.map((a: any) => new Date(a.date).getTime())));
      return lastSeen < twoWeeksAgo;
    });

    // 4. Cell Stats & Trends (Same as before)
    const cellStats: Record<string, number> = {};
    const attendanceMap: Record<string, number> = {};

    members.forEach((m: any) => {
      // Cell Count
      const cell = m.cell || "Unknown";
      cellStats[cell] = (cellStats[cell] || 0) + 1;

      // Attendance History
      m.attendance?.forEach((a: any) => {
        const dateKey = new Date(a.date).toISOString().split('T')[0];
        attendanceMap[dateKey] = (attendanceMap[dateKey] || 0) + 1;
      });
    });

    const trend = Object.entries(attendanceMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Last 10 services

    return NextResponse.json({
      totalMembers,
      firstTimers, // <--- SENDING THIS NEW DATA
      riskCount: retentionRisk.length,
      cellStats,
      trend
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}