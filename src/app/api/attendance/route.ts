import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { getSession } from "@/lib/auth";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(req: Request) {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();

    const { memberId, serviceType, date } = await req.json();

    if (!memberId || !serviceType) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Find the member first to check for duplicates
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

    // 2. Use updateOne with $push to avoid full document validation errors
    await Member.updateOne(
      { _id: memberId },
      {
        $push: {
          attendance: {
            date: targetDate,
            serviceType: serviceType,
            status: "Present"
          }
        }
      }
    );

    return NextResponse.json({ success: true, memberId }, { status: 200 });

  } catch (error) {
    console.error("Attendance Error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();
    const { memberId, serviceType, date } = await req.json();

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Use $pull for an atomic, reliable deletion
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