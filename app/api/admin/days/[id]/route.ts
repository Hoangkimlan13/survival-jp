import { prisma } from "@/lib/prisma"

// ================= GET =================
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const day = await prisma.day.findUnique({
    where: { id: Number(id) }
  })

  return Response.json(day)
}

// ================= UPDATE =================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 })
  }

  const updated = await prisma.day.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      description: body.description,
      order: body.order,
      isPublished: body.isPublished ?? false
    }
  })

  return Response.json(updated)
}

// ================= DELETE =================
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const dayId = Number(id)

  try {
    await prisma.choice.deleteMany({
      where: { question: { stage: { dayId } } }
    })

    await prisma.question.deleteMany({
      where: { stage: { dayId } }
    })

    await prisma.stage.deleteMany({
      where: { dayId }
    })

    await prisma.ending.deleteMany({
      where: { dayId }
    })

    await prisma.day.delete({
      where: { id: dayId }
    })

    return Response.json({ ok: true })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}