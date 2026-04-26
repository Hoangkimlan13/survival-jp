import { prisma } from "@/lib/prisma"

const triggerMap = {
  good: "GOOD",
  medium: "MEDIUM",
  bad: "BAD",
  win: "WIN",
  lose: "LOSE"
} as const

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const dayId = searchParams.get("dayId")
  const stageId = searchParams.get("stageId")

  const stories = await prisma.story.findMany({
    where: {
      ...(dayId ? { dayId: Number(dayId) } : {}),
      ...(stageId ? { stageId: Number(stageId) } : {})
    },
    orderBy: { order: "asc" }
  })

  return Response.json(stories)
}

/* ================= CREATE ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const story = await prisma.story.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type || "stage",

        trigger: body.trigger
          ? triggerMap[body.trigger as keyof typeof triggerMap] ?? null
          : null,

        order: Number(body.order || 1),
        weight: Number(body.weight || 1),

        stageId: body.stageId ? Number(body.stageId) : null,
        dayId: body.dayId ? Number(body.dayId) : null,

        // ⭐ PRO LEVEL
        isDraft: body.isDraft ?? true
      }
    })

    return Response.json(story)
  } catch (e) {
    console.error("CREATE STORY ERROR:", e)
    return new Response("CREATE_ERROR", { status: 500 })
  }
}