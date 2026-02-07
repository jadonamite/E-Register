import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

export async function GET() {
  try {
    await connectDB();
    const members = await Member.find({}).sort({ createdAt: -1 });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Check if phone exists
    const exists = await Member.findOne({ phone: body.phone });
    if (exists) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }

    const newMember = await Member.create({
      ...body,
      attendance: [] // Initialize empty attendance
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}