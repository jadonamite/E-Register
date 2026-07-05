import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import OutreachConfig from "@/models/OutreachConfig";
import { getSession } from "@/lib/auth";

interface TimeGates {
  Sunday: { earlyThreshold: string; lateThreshold: string };
  "Mid-Week": { earlyThreshold: string; lateThreshold: string };
}

export async function GET() {
  try {
    await connectDB();

    const timeGates: TimeGates = {
      Sunday: { earlyThreshold: "08:00", lateThreshold: "09:30" },
      "Mid-Week": { earlyThreshold: "19:00", lateThreshold: "20:00" },
    };

    for (const service of ["Sunday", "Mid-Week"]) {
      const earlyDoc = await OutreachConfig.findOne({
        key: `attendance:${service}:earlyThreshold`,
      });
      const lateDoc = await OutreachConfig.findOne({
        key: `attendance:${service}:lateThreshold`,
      });

      if (earlyDoc) timeGates[service as keyof TimeGates].earlyThreshold = earlyDoc.value;
      if (lateDoc) timeGates[service as keyof TimeGates].lateThreshold = lateDoc.value;
    }

    return NextResponse.json(timeGates);
  } catch (error) {
    console.error("Config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance config" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (session?.kind !== "exec") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { service, earlyThreshold, lateThreshold } = await req.json();

    if (!service || !earlyThreshold || !lateThreshold) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await OutreachConfig.findOneAndUpdate(
      { key: `attendance:${service}:earlyThreshold` },
      { value: earlyThreshold },
      { upsert: true }
    );

    await OutreachConfig.findOneAndUpdate(
      { key: `attendance:${service}:lateThreshold` },
      { value: lateThreshold },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "Failed to update attendance config" },
      { status: 500 }
    );
  }
}
