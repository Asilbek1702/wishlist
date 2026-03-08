import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const wishlists = await prisma.wishlist.findMany({
    where: { isPublic: true },
    include: {
      items: true,
      owner: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(wishlists);
}