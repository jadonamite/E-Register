import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import Marker from "@/models/Marker";
import { verifyPin } from "@/lib/pin";
import { signMarkerSession, SESSION_COOKIE, cookieOptions } from "@/lib/auth";

/** Marker (protocol-staff) sign-in: name is chosen from a dropdown, PIN verified here. */
export async function POST(req: Request) {
  try {
    const { markerId, pin } = await req.json();

    if (!isValidObjectId(markerId) || typeof pin !== "string") {
      return NextResponse.json({ error: "Marker and PIN required" }, { status: 400 });
    }

    await connectDB();
    const marker = await Marker.findById(markerId);

    // Same generic message whether the marker is missing, inactive, or the PIN
    // is wrong — don't leak which markers exist / are active.
    if (!marker || !marker.active || !verifyPin(pin, marker.pinHash)) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    const token = await signMarkerSession(marker._id.toString(), marker.name);
    const res = NextResponse.json({ name: marker.name }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
