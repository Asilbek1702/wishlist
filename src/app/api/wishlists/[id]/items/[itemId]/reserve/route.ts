import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { pusherServer, WISHLIST_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";

const schema = z.object({
  guestName: z.string().min(1, "Введите имя").optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(200).optional(),
  notifyOnEvent: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  const { id, itemId } = await params;

  const wishlist = await prisma.wishlist.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = wishlist.items.find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "AVAILABLE") {
    return NextResponse.json(
      { error: "Товар уже забронирован" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const isAuth = !!session?.user;
    const guestName = isAuth
      ? session.user.name || session.user.email || "Пользователь"
      : parsed.data.guestName || "Гость";
    const guestEmail = isAuth
      ? session.user.email
      : parsed.data.guestEmail || null;
    const guestToken = !isAuth
      ? crypto.randomBytes(32).toString("hex")
      : null;

    const reservation = await prisma.reservation.create({
      data: {
        itemId,
        userId: session?.user?.id ?? null,
        guestName,
        guestEmail,
        guestToken,
        message: parsed.data.message || null,
        notifyOnEvent: parsed.data.notifyOnEvent ?? false,
      },
    });

    await prisma.wishlistItem.update({
      where: { id: itemId },
      data: { status: "RESERVED" },
    });

    // Всегда слаём masked name — владелец не должен знать кто бронирует
    await pusherServer.trigger(
      WISHLIST_CHANNEL(wishlist.slug),
      PUSHER_EVENTS.ITEM_RESERVED,
      {
        itemId,
        guestName: "Кто-то из друзей",
        reservedAt: reservation.createdAt,
      }
    );

    return NextResponse.json({
      success: true,
      token: guestToken,
    });
  } catch (error) {
    console.error("Reserve error:", error);
    return NextResponse.json(
      { error: "Ошибка при бронировании" },
      { status: 500 }
    );
  }
}
