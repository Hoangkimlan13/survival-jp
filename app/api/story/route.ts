import { prisma } from "@/lib/prisma"
import type { Story, StoryTrigger } from "@prisma/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const stageId = Number(searchParams.get("stageId"))
  const dayId = Number(searchParams.get("dayId"))
  const triggerParam = searchParams.get("trigger")

  /* ================= MAP TRIGGER ================= */

  const triggerMap: Partial<Record<string, StoryTrigger>> = {
    CRITICAL: "LOSE",
    BAD_STREAK: "BAD",
    BAD: "BAD",
    GOOD: "GOOD",
    COMBO: "GOOD",
    COMBO_3: "COMBO_3",
    MEDIUM: "MEDIUM",
    NORMAL: "MEDIUM",

  }

  const trigger =
  triggerParam ? triggerMap[triggerParam] : undefined

  /* ================= QUERY ================= */

  let stories: Story[] = await prisma.story.findMany({
    where: {
      isActive: true,
      isDraft: false,
      OR: [
        { stageId },
        { dayId }
      ],
      ...(trigger ? { trigger } : { trigger: "MEDIUM" })
    }
  })

  /* ================= FALLBACK ================= */
  // 🔥 Nếu không có story theo trigger → fallback MEDIUM
  if (!stories.length && trigger !== "MEDIUM") {
    stories = await prisma.story.findMany({
      where: {
        isActive: true,
        isDraft: false,
        OR: [
          { stageId },
          { dayId }
        ],
        trigger: "MEDIUM"
      }
    })
  }

  if (!stories.length) return Response.json(null)

  /* ================= WEIGHT RANDOM ================= */

  const totalWeight = stories.reduce((sum, s) => sum + (s.weight || 1), 0)
  let rand = Math.random() * totalWeight

  let picked = stories[0]

  for (const s of stories) {
    rand -= (s.weight || 1)
    if (rand <= 0) {
      picked = s
      break
    }
  }

  /* ================= UPDATE USED COUNT ================= */

  await prisma.story.update({
    where: { id: picked.id },
    data: { usedCount: { increment: 1 } }
  })

  return Response.json(picked)
}