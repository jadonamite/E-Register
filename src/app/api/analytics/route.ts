import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    
    const members = await Member.find({}).lean();
    
    // 1. Calculate Total Members
    const totalMembers = members.length;

    // 2. Calculate "Retention Risk" (Absent for last 2 Sundays)
    // We look for members who have NO attendance in the last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const retentionRisk = members.filter((m: any) => {
      // If they have NO attendance at all, they are a risk
      if (!m.attendance || m.attendance.length === 0) return true;
      
      // Check the latest attendance date
      const lastSeen = new Date(Math.max(...m.attendance.map((a: any) => new Date(a.date).getTime())));
      return lastSeen < twoWeeksAgo;
    });

    // 3. Cell Breakdown (Which cell has most members?)
    const cellStats: Record<string, number> = {};
    members.forEach((m: any) => {
      const cell = m.cell || "Unknown";
      cellStats[cell] = (cellStats[cell] || 0) + 1;
    });

    // 4. Attendance Trend (Last 4 Services)
    // This is a simplified "Last 30 Days" grouper
    const attendanceMap: Record<string, number> = {};
    
    members.forEach((m: any) => {
      m.attendance?.forEach((a: any) => {
        const dateKey = new Date(a.date).toISOString().split('T')[0]; // "2026-02-08"
        attendanceMap[dateKey] = (attendanceMap[dateKey] || 0) + 1;
      });
    });

    // Convert map to array and sort by date
    const trend = Object.entries(attendanceMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-5); // Just take the last 5 services

    return NextResponse.json({
      totalMembers,
      riskCount: retentionRisk.length,
      riskList: retentionRisk.slice(0, 5), // Send top 5 names for the dashboard
      cellStats,
      trend
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}