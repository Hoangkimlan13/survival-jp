import { prisma } from "@/lib/prisma"

export async function GET() {
  const data = await prisma.question.findMany({
    include: { choices: true }
  })

  return Response.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()

  const question = await prisma.question.create({
    data: {
      question: body.question,
      translation: body.translation,
      levelId: body.levelId,
      stageId: body.stageId,
      choices: {
        create: body.choices
      }
    }
  })

  return Response.json(question)
}