import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getMobileSession } from "@/lib/mobile-auth";

const createItemSchema = z.object({
  title: z.string().min(1, "Введите название"),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().default("RUB"),
  imageUrl: z.string().optional().nullable(),
  productUrl: z.string().optional().nullable(),
  priority: z.number().min(1).max(3).default(1),
  isGroupGift: z.boolean().default(false),
  targetAmount: z.number().optional().nullable(),
  position: z.number().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getMobileSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId: id },
    orderBy: { position: "asc" },
    include: { reservation: true, contributions: true },
  });

  return NextResponse.json(items);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getMobileSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = createItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const maxPosition = await prisma.wishlistItem.aggregate({
      where: { wishlistId: id },
      _max: { position: true },
    });
    const position = parsed.data.position ?? (maxPosition._max.position ?? -1) + 1;

    const item = await prisma.wishlistItem.create({
      data: {
        wishlistId: id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        price: parsed.data.price != null ? parsed.data.price : null,
        currency: parsed.data.currency,
        imageUrl: parsed.data.imageUrl ?? null,
        productUrl: parsed.data.productUrl ?? null,
        priority: parsed.data.priority,
        isGroupGift: parsed.data.isGroupGift,
        targetAmount: parsed.data.targetAmount != null ? parsed.data.targetAmount : null,
        position,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Ошибка при добавлении товара" },
      { status: 500 }
    );
  }
}
