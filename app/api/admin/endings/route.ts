import { prisma } from "@/lib/prisma"

/* ================= TYPE MAP ================= */
const typeMap = {
  good: "GOOD",
  medium: "MEDIUM",
  bad: "BAD",
  win: "WIN",
  lose: "LOSE"
} as const

/* ================= GET ENDINGS ================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const dayId = searchParams.get("dayId")

  const endings = await prisma.ending.findMany({
    where: {
      ...(dayId ? { dayId: Number(dayId) } : {})
    },
    orderBy: {
      id: "asc"
    }
  })

  return Response.json(endings)
}

/* ================= CREATE ENDING ================= */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const ending = await prisma.ending.create({
      data: {
        title: body.title,
        message: body.message,

        type: body.type
          ? typeMap[body.type as keyof typeof typeMap] ?? body.type
          : null,

        image: body.image || null,
        isDraft: body.isDraft ?? true,

        day: {
          connect: { id: Number(body.dayId) }
        }
      }
    })

    return Response.json(ending)
  } catch (err) {
    console.error("CREATE ENDING ERROR:", err)
    return new Response("CREATE_ERROR", { status: 500 })
  }
}