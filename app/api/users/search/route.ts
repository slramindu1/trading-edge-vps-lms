import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "";

  if (!email) {
    return Response.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: email,
        mode: "insensitive",
      },
      // ✅ ONLY STUDENTS
      user_type_id: 2,
    },
    take: 5,
    select: {
      email: true,
    },
  });

  return Response.json(users.map((u) => u.email));
}
