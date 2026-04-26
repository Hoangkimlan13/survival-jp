import { prisma } from "@/lib/prisma"

// ================= GET =================
export async function GET() {
  try {

    const days = await prisma.day.findMany({
      orderBy: { order: "asc" },
      include: {
        stages: {
          include: { questions: true }
        },
        endings: true // ✅ sửa ở đây
      }
    })

    const formatted = days.map((day: any) => {
      const totalQuestions = (day.stages || []).reduce(
        (sum: number, s: any) => sum + (s.questions?.length || 0),
        0
      )

      return {
        id: day.id,
        name: day.name,
        description: day.description,
        order: day.order,
        isPublished: day.isPublished,

        stageCount: day.stages.length,
        questionCount: totalQuestions,

        // ✅ sửa logic
        endingCount: day.endings.length,
        hasEnding: day.endings.length > 0
      }
    })

    return Response.json(formatted)

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
}

// ================= POST =================
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.name) {
      return new Response(
        JSON.stringify({ error: "Missing name" }),
        { status: 400 }
      )
    }
    

    const newDay = await prisma.day.create({
      data: {
        name: body.name,
        description: body.description || "",
        order: body.order || 1,
        isPublished: body.isPublished ?? false
      }
    })

    return Response.json(newDay)

  } catch (err: any) {
    console.error("POST ERROR:", err)

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
}