import { prisma } from "@/lib/prisma"


export const revalidate = 60 // 🔥 CACHE EDGE 60s

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const stageIdParam = searchParams.get("stageId")
  const stageId = stageIdParam ? Number(stageIdParam) : null

  if (!stageId || Number.isNaN(stageId)) {
    return Response.json([], { status: 200 })
  }

  const questions = await prisma.question.findMany({
    where: {
      stageId: stageId,
      isPublished: true
    },
   select: {
    id: true,
    question: true,
    translation: true,
    stageId: true,
    choices: {
      select: {
        id: true,
        text: true,
        translation: true,
        feedback: true,
        quality: true
      }
    }
  }
  })

  return Response.json(questions)
}