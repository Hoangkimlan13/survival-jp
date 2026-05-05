import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const stageId = Number(searchParams.get("stageId"))

  const questions = await prisma.question.findMany({
    where: {
      stageId
    },
    include: {
      choices: true
    }
  })

  return Response.json(questions)
}