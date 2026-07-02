import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** Who is this browser? Used by the client to decide guest vs marker vs exec. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ kind: null });
  if (session.kind === "marker") {
    return NextResponse.json({ kind: "marker", name: session.name });
  }
  return NextResponse.json({ kind: "exec" });
}
