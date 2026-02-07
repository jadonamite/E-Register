import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { memberId, serviceType, date } = await req.json();

    if (!memberId || !serviceType) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Find the member
    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 2. check if already marked for THIS service on THIS day (Prevent Duplicates)
    // We compare the date strings (YYYY-MM-DD)
    const todayStr = new Date(date).toDateString();
    
    const alreadyPresent = member.attendance.some((record: any) => {
      const recordDate = new Date(record.date).toDateString();
      return recordDate === todayStr && record.serviceType === serviceType;
    });

    if (alreadyPresent) {
      return NextResponse.json({ message: "Already marked present" }, { status: 200 });
    }

    // 3. Add the new record
    member.attendance.push({
      date: new Date(date),
      serviceType: serviceType,
      status: "Present"
    });

    await member.save();

    return NextResponse.json({ success: true, memberId }, { status: 200 });

  } catch (error) {
    console.error("Attendance Error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}