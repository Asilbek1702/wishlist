import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateSlug } from "@/lib/utils";
import { getMobileSession } from "@/lib/mobile-auth";

const createSchema = z.object({
  title: z.string().min(1, "Введите название"),
  description: z.string().optional(),
  occasion: z.string().optional(),
  eventDate: z.string().optional(),
  coverColor: z.string().default("#6366f1"),
  isPublic: z.boolean().default(true),
});

export async function GET(req: Request) {
  const session = await getMobileSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wishlists = await prisma.wishlist.findMany({
    where: { ownerId: session.user.id },
    include: {
      items: true,
      owner: { select: { id: true, name: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(wishlists);
}

export async function POST(req: Request) {
  const session = await getMobileSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    let slug = generateSlug();
    let exists = await prisma.wishlist.findUnique({ where: { slug } });
    while (exists) {
      slug = generateSlug();
      exists = await prisma.wishlist.findUnique({ where: { slug } });
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        ...parsed.data,
        eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
        ownerId: session.user.id,
        slug,
      },
      include: {
        items: true,
        owner: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Create wishlist error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании вишлиста" },
      { status: 500 }
    );
  }
}