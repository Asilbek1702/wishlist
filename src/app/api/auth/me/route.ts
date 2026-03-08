import { NextResponse } from "next/server";
import { getMobileSession } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const session = await getMobileSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(session.user);
}