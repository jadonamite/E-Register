import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET() {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();
    const members = await Member.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(members, { status: 200 });
  } catch (error: any) {
    console.error("❌ GET ERROR:", error); 
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();
    const body = await req.json();

    const exists = await Member.findOne({ phone: body.phone });
    if (exists) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }

    const newMember = await Member.create({
      ...body,
      attendance: []
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    console.error("❌ POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// 4. NEW: Update Member Details
export async function PUT(req: Request) {
  try {
    if (!(await getSession())) return unauthorized();
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) return NextResponse.json({ error: "Member ID required" }, { status: 400 });

    const updatedMember = await Member.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMember) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    return NextResponse.json(updatedMember, { status: 200 });
  } catch (error: any) {
    console.error("❌ PUT ERROR:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}