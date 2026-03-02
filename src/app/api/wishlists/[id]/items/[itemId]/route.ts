import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { pusherServer, WISHLIST_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";

const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  productUrl: z.string().optional().nullable(),
  priority: z.number().min(1).max(3).optional(),
  isGroupGift: z.boolean().optional(),
  targetAmount: z.number().optional().nullable(),
  position: z.number().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await params;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, wishlistId: id },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const updated = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: parsed.data,
    });

    await pusherServer.trigger(WISHLIST_CHANNEL(wishlist.slug), PUSHER_EVENTS.ITEM_UPDATED, {
      item: updated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update item error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await params;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.wishlistItem.findFirst({
    where: { id: itemId, wishlistId: id },
    include: {
      contributions: { where: { status: "ACTIVE" } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // EDGE CASE: Если есть активные взносы — мягкое удаление
  if (item.contributions.length > 0) {
    await prisma.$transaction(async (tx) => {
      // Помечаем товар как недоступный
      await tx.wishlistItem.update({
        where: { id: itemId },
        data: { status: "UNAVAILABLE" },
      });
      // Помечаем все взносы как возврат
      await tx.contribution.updateMany({
        where: { itemId, status: "ACTIVE" },
        data: { status: "REFUNDED" },
      });
    });

    await pusherServer.trigger(WISHLIST_CHANNEL(wishlist.slug), PUSHER_EVENTS.ITEM_STATUS_CHANGED, {
      itemId,
      status: "UNAVAILABLE",
    });

    return NextResponse.json({
      success: true,
      soft: true,
      message: "Товар помечен как недоступен — были активные взносы",
    });
  }

  // Нет взносов — физическое удаление
  await prisma.wishlistItem.delete({ where: { id: itemId } });

  await pusherServer.trigger(WISHLIST_CHANNEL(wishlist.slug), PUSHER_EVENTS.ITEM_DELETED, {
    itemId,
  });

  return NextResponse.json({ success: true });
}
