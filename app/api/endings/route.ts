import { prisma } from "@/lib/prisma"
import type { Ending } from "@prisma/client" 

export async function GET(req: Request) {
  try {
    
    const { searchParams } = new URL(req.url)

    const dayId = Number(searchParams.get("dayId"))

    if (!dayId) {
      return Response.json({ error: "Missing dayId" }, { status: 400 })
    }

    const typeRaw = (searchParams.get("type") ?? "normal").toLowerCase()

    const typeMap: Record<string, string> = {
      good: "GOOD",
      normal: "NORMAL",
      bad: "BAD",
      secret: "SECRET"
    }

    const dbType = typeMap[typeRaw] ?? "NORMAL"

    /* ================= QUERY MAIN ================= */

    let endings: Ending[] = await prisma.ending.findMany({ 
      where: {
        dayId,
        isDraft: false,
        type: {
          equals: dbType,
          mode: "insensitive"
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    /* ================= FALLBACK ================= */

    if (endings.length === 0 && dbType !== "NORMAL") {
      console.warn("[FALLBACK ENDING → NORMAL]")

      endings = await prisma.ending.findMany({
        where: {
          dayId,
          isDraft: false,
          type: {
            equals: "NORMAL",
            mode: "insensitive"
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      })
    }

    if (!endings.length) {
      return Response.json([])
    }

    /* ================= FORMAT ================= */

    const result = endings.map((e: Ending) => ({  
      id: e.id,
      type: e.type.toLowerCase(),
      title: e.title,
      message: e.message,
      image: e.image ?? null
    }))

    return Response.json(result)

  } catch (err) {
    console.error("[ENDINGS API ERROR]", err)

    
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
  
}