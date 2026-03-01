import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer, WISHLIST_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  const { id, itemId } = await params;

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const wishlist = await prisma.wishlist.findUnique({
    where: { id },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { itemId },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Резервация не найдена" }, { status: 404 });
  }

  const canUnreserve =
    session?.user?.id === reservation.userId ||
    (reservation.guestToken && token === reservation.guestToken);

  if (!canUnreserve) {
    return NextResponse.json(
      { error: "Только тот, кто бронировал, может снять бронь" },
      { status: 403 }
    );
  }

  await prisma.reservation.delete({ where: { itemId } });
  await prisma.wishlistItem.update({
    where: { id: itemId },
    data: { status: "AVAILABLE" },
  });

  await pusherServer.trigger(WISHLIST_CHANNEL(wishlist.slug), PUSHER_EVENTS.ITEM_UNRESERVED, {
    itemId,
  });

  return NextResponse.json({ success: true });
}
