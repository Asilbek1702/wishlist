import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getMobileSession(req: Request) {
  // Сначала пробуем обычную сессию NextAuth
  const session = await auth();
  if (session?.user?.id) return session;

  // Потом пробуем токен из заголовка (для мобильного приложения)
  const token = req.headers.get('x-user-token');
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { id: true, name: true, email: true, image: true }
  });

  if (!user) return null;
  return { user };
}
