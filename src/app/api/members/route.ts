import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

export const dynamic = "force-dynamic"; // Forces Next.js to not cache this

export async function GET() {
  try {
    await connectDB();
    
    // .lean() converts complex Mongoose Documents to simple JSON instantly
    // This often fixes timeouts and serialization errors
    const members = await Member.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(members, { status: 200 });
  } catch (error: any) {
    // THIS IS THE IMPORTANT PART
    console.error("❌ GET ERROR DETAILS:", error); 
    
    return NextResponse.json(
      { error: "Failed to fetch members", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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