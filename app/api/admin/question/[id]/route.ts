import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

function checkAdmin() {
  const c = cookies().get("admin")?.value
  if (!c) throw new Error("Unauthorized")
}

/* GET ONE */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  checkAdmin()

  const q = await prisma.question.findUnique({
    where: { id: Number(params.id) },
    include: { choices: true }
  })

  return Response.json(q)
}

/* UPDATE */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  checkAdmin()

  const body = await req.json()

  await prisma.choice.deleteMany({
    where: { questionId: Number(params.id) }
  })

  const q = await prisma.question.update({
    where: { id: Number(params.id) },
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

/* DELETE */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  checkAdmin()

  await prisma.question.delete({
    where: { id: Number(params.id) }
  })

  return Response.json({ ok: true })
}