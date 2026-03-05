import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user?.password) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }
  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }
  return NextResponse.json({
    token: user.id,
    user: { id: user.id, name: user.name, email: user.email, image: user.image },
  });
}