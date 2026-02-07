import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Member from "@/models/Member";

// 1. GET: Fetch all members (sorted alphabetically)
export async function GET() {
  try {
    await connectDB();
    
    // Find all members and sort them A-Z by name
    const members = await Member.find({}).sort({ name: 1 });

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// 2. POST: Add a new member
export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Get the data sent from the "Add Member" form
    const body = await req.json();
    
    // Validation: Ensure the critical fields exist
    if (!body.name || !body.phone || !body.cell) {
      return NextResponse.json(
        { error: "Name, Phone, and Cell are required." },
        { status: 400 }
      );
    }

    // Check if phone number already exists (Prevent Duplicates)
    const existingMember = await Member.findOne({ phone: body.phone });
    if (existingMember) {
      return NextResponse.json(
        { error: "Member with this phone number already exists." },
        { status: 409 }
      );
    }

    // Create the new member
    const newMember = await Member.create({
      name: body.name,
      phone: body.phone,
      cell: body.cell,        // Flexible: Accepts "Healing School", "Zion", etc.
      churchDept: body.churchDept || "None",
      schoolDept: body.schoolDept,
      level: body.level,
      role: body.role || "Base Member",
      attendance: []          // Start with empty attendance
    });

    return NextResponse.json(
      { message: "Member added successfully", member: newMember },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: "Failed to register member" },
      { status: 500 }
    );
  }
}