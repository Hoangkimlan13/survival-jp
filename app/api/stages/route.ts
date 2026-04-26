import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dayId = Number(searchParams.get("dayId"))

  const stages = await prisma.stage.findMany({
    where: {
      dayId,
      isPublished: true
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true
    }
  })

  return Response.json(stages)
}