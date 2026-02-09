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

    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const targetDate = new Date(date);
    const targetDateStr = targetDate.toDateString();
    
    const alreadyPresent = member.attendance.some((record: any) => {
      const recordDate = new Date(record.date).toDateString();
      return recordDate === targetDateStr && record.serviceType === serviceType;
    });

    if (alreadyPresent) {
      return NextResponse.json({ message: "Already marked present" }, { status: 200 });
    }

    member.attendance.push({
      date: targetDate,
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

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { memberId, serviceType, date } = await req.json();

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Use $pull for an atomic, reliable deletion of the specific sub-document
    const result = await Member.findByIdAndUpdate(
      memberId,
      {
        $pull: {
          attendance: {
            serviceType: serviceType,
            date: { $gte: startOfDay, $lte: endOfDay }
          }
        }
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, memberId }, { status: 200 });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to unmark" }, { status: 500 });
  }
}