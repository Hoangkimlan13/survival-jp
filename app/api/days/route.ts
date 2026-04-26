import { prisma } from "@/lib/prisma"

export async function GET() {
  const days = await prisma.day.findMany({
    where: {
      isPublished: true // 🔥 chỉ lấy public
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true
    }
  })

  return Response.json(days)
}