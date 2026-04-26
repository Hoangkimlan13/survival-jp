import { prisma } from "@/lib/prisma"
import type { Story } from "@prisma/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const stageId = Number(searchParams.get("stageId"))
  const dayId = Number(searchParams.get("dayId"))

  const stories: Story[] = await prisma.story.findMany({
    where: {
      isActive: true,
      isDraft: false,
      OR: [
        { stageId },
        { dayId }
      ]
    }
  })

  if (!stories.length) return Response.json(null)

    
  // 🎲 random theo weight
  const pool: any[] = []
  stories.forEach((s) => {
    for (let i = 0; i < (s.weight || 1); i++) {
      pool.push(s)
    }
  })

  const picked = pool[Math.floor(Math.random() * pool.length)]

  // 👉 tăng usedCount
  await prisma.story.update({
    where: { id: picked.id },
    data: { usedCount: { increment: 1 } }
  })

  return Response.json(picked)
}