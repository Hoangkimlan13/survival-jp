import { prisma } from "@/lib/prisma"

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await req.json()

  const updated = await prisma.question.update({
    where: { id: Number(id) },
    data: {
      question: body.question,
      translation: body.translation || "",
      isPublished: body.isPublished ?? false,

      choices: {
        deleteMany: {}, // clear hết
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
    include: { choices: true }
  })

  return Response.json(updated)
}

// DELETE QUESTION
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const questionId = Number(id)

    // Xóa choices trước (tránh lỗi foreign key)
    await prisma.choice.deleteMany({
      where: { questionId }
    })

    // Xóa question
    await prisma.question.delete({
      where: { id: questionId }
    })

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error("DELETE QUESTION ERROR:", err)

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
}