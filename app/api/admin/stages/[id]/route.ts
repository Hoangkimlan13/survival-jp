import { prisma } from "@/lib/prisma"

// ================= UPDATE =================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    if (!body.name) {
      return Response.json(
        { error: "Missing name" },
        { status: 400 }
      )
    }

    const updated = await prisma.stage.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        order: body.order ?? 1,
        isPublished: body.isPublished,
        minQuestions: body.minQuestions ?? 5,
        maxQuestions: body.maxQuestions ?? 10
      }
    })

    return Response.json(updated)

  } catch (err: any) {
    console.error("UPDATE STAGE ERROR:", err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

// ================= DELETE =================
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.stage.delete({
      where: { id: Number(id) }
    })

    return Response.json({ ok: true })

  } catch (err: any) {
    console.error("DELETE STAGE ERROR:", err)

    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}