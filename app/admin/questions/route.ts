import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

function checkAdmin() {
  const c = cookies().get("admin")?.value
  if (!c) throw new Error("Unauthorized")
}

/* GET ALL */
export async function GET() {
  checkAdmin()

  const data = await prisma.question.findMany({
    include: {
      choices: true,
      level: true,
      stage: true
    },
    orderBy: { id: "desc" }
  })

  return Response.json(data)
}

/* CREATE */
export async function POST(req: Request) {
  checkAdmin()

  const body = await req.json()

  const q = await prisma.question.create({
    data: {
      question: body.question,
      translation: body.translation,
      levelId: Number(body.levelId),
      stageId: Number(body.stageId),
      choices: {
        create: body.choices
      }
    }
  })

  return Response.json(q)
}