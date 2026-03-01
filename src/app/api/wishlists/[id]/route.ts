import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  occasion: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  coverColor: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      items: { orderBy: { position: "asc" } },
      owner: { select: { id: true, name: true, image: true } },
    },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(wishlist);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.eventDate !== undefined) {
      data.eventDate = parsed.data.eventDate ? new Date(parsed.data.eventDate) : null;
    }

    const updated = await prisma.wishlist.update({
      where: { id },
      data,
      include: {
        items: { orderBy: { position: "asc" } },
        owner: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update wishlist error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
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

  await prisma.wishlist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
