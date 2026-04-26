import { prisma } from "@/lib/prisma"

/* ================= UPDATE ================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params   

    const body = await req.json()

    const ending = await prisma.ending.update({
      where: {
        id: Number(id)
      },
      data: {
        title: body.title,
        message: body.message,
        type: body.type ?? null,
        image: body.image || null,
        isDraft: body.isDraft ?? true
      }
    })

    return Response.json(ending)
  } catch (err) {
    console.error("UPDATE ENDING ERROR:", err)
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

    await prisma.ending.delete({
      where: {
        id: Number(id)
      }
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error("DELETE ENDING ERROR:", err)
    return new Response("DELETE_ERROR", { status: 500 })
  }
}