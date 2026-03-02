import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { pusherServer, WISHLIST_CHANNEL, PUSHER_EVENTS } from "@/lib/pusher";

const schema = z.object({
  amount: z.number().min(1, "Введите сумму"),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(200).optional(),
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
  if (!item || !item.isGroupGift || !item.targetAmount) {
    return NextResponse.json(
      { error: "Item not found or not a group gift" },
      { status: 404 }
    );
  }

  if (item.status === "FULFILLED") {
    return NextResponse.json(
      { error: "Сбор уже завершён, спасибо!" },
      { status: 400 }
    );
  }

  if (item.status === "UNAVAILABLE") {
    return NextResponse.json({ error: "Товар недоступен" }, { status: 400 });
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

    const target = Number(item.targetAmount);
    const minAmount = Math.max(50, target * 0.01);
    if (parsed.data.amount < minAmount) {
      return NextResponse.json(
        { error: `Минимальная сумма ${Math.round(minAmount)} ₽` },
        { status: 400 }
      );
    }

    const isAuth = !!session?.user;

    const result = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.wishlistItem.findUnique({
        where: { id: itemId },
        include: {
          contributions: { where: { status: "ACTIVE" } },
        },
      });

      if (!currentItem) throw new Error("Item not found");
      const targetAmount = Number(currentItem.targetAmount);
      const collected = currentItem.contributions.reduce(
        (s, c) => s + Number(c.amount),
        0
      );
      const remaining = targetAmount - collected;

      if (remaining <= 0) throw new Error("Сбор уже завершён, спасибо!");

      // Обрезаем сумму если превышает остаток
      let amount = parsed.data.amount;
      if (amount > remaining) amount = remaining;

      const contribution = await tx.contribution.create({
        data: {
          itemId,
          userId: session?.user?.id ?? null,
          guestName: isAuth ? null : parsed.data.guestName ?? null,
          guestEmail: isAuth ? null : parsed.data.guestEmail || null,
          amount: new Decimal(amount),
          message: parsed.data.message || null,
        },
      });

      const newTotal = collected + amount;
      const newStatus = newTotal >= targetAmount ? "FULFILLED" : "COLLECTING";

      await tx.wishlistItem.update({
        where: { id: itemId },
        data: { status: newStatus },
      });

      return { contribution, totalCollected: newTotal, status: newStatus, amount };
    });

    // Всегда masked — владелец не видит кто скидывается
    await pusherServer.trigger(
      WISHLIST_CHANNEL(wishlist.slug),
      PUSHER_EVENTS.CONTRIBUTION_ADDED,
      {
        itemId,
        amount: result.amount,
        totalCollected: result.totalCollected,
        contributorName: "Кто-то из друзей",
      }
    );

    if (result.status === "FULFILLED") {
      await pusherServer.trigger(
        WISHLIST_CHANNEL(wishlist.slug),
        PUSHER_EVENTS.ITEM_STATUS_CHANGED,
        { itemId, status: "FULFILLED" }
      );
    }

    return NextResponse.json({
      success: true,
      totalCollected: result.totalCollected,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Contribute error:", error);
    return NextResponse.json(
      { error: "Ошибка при внесении вклада" },
      { status: 500 }
    );
  }
}
