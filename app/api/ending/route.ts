import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const dayId = Number(searchParams.get("dayId"))
  const type = searchParams.get("type") || "bad"

  const ending = await prisma.ending.findFirst({
    where: {
      dayId,
      type,
      isDraft: false
    }
  })

  return Response.json(ending)
}