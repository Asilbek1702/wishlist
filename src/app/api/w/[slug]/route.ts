import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const wishlist = await prisma.wishlist.findUnique({
    where: { slug, isPublic: true },
    include: {
      items: {
        where: { status: { not: "UNAVAILABLE" } },
        orderBy: { position: "asc" },
        include: {
          reservation: true,
          contributions: { where: { status: "ACTIVE" } },
        },
      },
      owner: { select: { id: true, name: true, image: true, email: true } },
    },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(wishlist);
}
