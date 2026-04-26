import { prisma } from "@/lib/prisma"

// ================= GET =================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dayId = Number(searchParams.get("dayId"))

  if (!dayId) {
    return Response.json({ error: "Missing dayId" }, { status: 400 })
  }

  const stages = await prisma.stage.findMany({
    where: { dayId },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  })

  const formatted = stages.map((s: any) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    isPublished: s.isPublished,
    questionCount: s._count.questions
  }))

  return Response.json(formatted)
}


// ================= POST =================
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.name || !body.dayId) {
      return Response.json(
        { error: "Missing name or dayId" },
        { status: 400 }
      )
    }

    const newStage = await prisma.stage.create({
      data: {
        name: body.name,
        order: body.order || 1,
        dayId: body.dayId,
        isPublished: body.isPublished ?? false,
        minQuestions: body.minQuestions ?? 5,
        maxQuestions: body.maxQuestions ?? 10
      }
    })

    return Response.json(newStage)

  } catch (err: any) {
    console.error("CREATE STAGE ERROR:", err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}