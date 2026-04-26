import { prisma } from "@/lib/prisma"

const triggerMap = {
  good: "GOOD",
  medium: "MEDIUM",
  bad: "BAD",
  win: "WIN",
  lose: "LOSE"
} as const

/* ================= UPDATE ================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json()
    const { id } = await context.params
    const storyId = Number(id)

    const story = await prisma.story.update({
      where: { id: storyId },
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
    return new Response("UPDATE_ERROR", { status: 500 })
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const storyId = Number(id)

    await prisma.story.delete({
      where: { id: storyId }
    })

    return Response.json({ ok: true })
  } catch (e) {
    return new Response("DELETE_ERROR", { status: 500 })
  }
}