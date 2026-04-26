import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const stageId = Number(searchParams.get("stageId"))

  if (!stageId) {
    return Response.json([], { status: 200 })
  }

  const questions = await prisma.question.findMany({
    where: { stageId },
    include: { choices: true },
    orderBy: { id: "asc" }
  })

  return Response.json(questions)
}

export async function POST(req: Request) {
  const body = await req.json()

  const q = await prisma.question.create({
    data: {
      question: body.question,
      translation: body.translation || "",
      stageId: body.stageId,
      isPublished: body.isPublished ?? false,

      choices: {
        create: (body.choices || []).map((c: any) => ({
          text: c.text,
          translation: c.translation || "",
          feedback: c.feedback || "",
          score: c.score ?? 0,

          quality: c.quality || "OK",
          isCorrect: c.isCorrect ?? false
        }))
      }
    },
    include: {
      choices: true
    }
  })

  return Response.json(q)
}