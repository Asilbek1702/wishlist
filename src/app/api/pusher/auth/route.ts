import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json();
  const { socket_id: socketId, channel_name: channelName } = body;

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const presenceData = session?.user
    ? { user_id: session.user.id, user_info: { name: session.user.name } }
    : { user_id: "anonymous", user_info: { name: "Guest" } };

  try {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
