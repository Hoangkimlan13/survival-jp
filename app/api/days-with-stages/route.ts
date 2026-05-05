import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const days = await prisma.day.findMany({
      orderBy: { order: "asc" },
      include: {
        stages: {
          orderBy: { order: "asc" }
        }
      }
    })

    return Response.json(days)
  } catch (err) {
    console.error(err)
    return new Response("Error", { status: 500 })
  }
}