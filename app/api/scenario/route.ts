import { prisma } from "@/lib/prisma"
import { Prisma, ChoiceQuality } from "@prisma/client"
import { parseJapanese } from "@/lib/japaneseParser"

type QuestionWithChoices = Prisma.QuestionGetPayload<{
  include: {
    choices: {
      select: {
        id: true,
        text: true,
        translation: true,
        feedback: true,
        quality: true
      }
    }
  }
}>


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const stageId = Number(searchParams.get("stageId"))
    const usedRaw = searchParams.get("used") || ""

    const usedIds = usedRaw
      ? usedRaw.split(",").map(Number)
      : []

    if (!stageId) {
      return new Response(
        JSON.stringify({ error: "Missing stageId" }),
        { status: 400 }
      )
    }

    const loadStages = async (dayId: number) => {
      const res = await fetch(`/api/stages?dayId=${dayId}`)
      return await res.json()
    }

    /* ===============================
       🎯 STEP 1: RANDOM LIMIT (6 → 12)
    =============================== */
    const LIMIT = Math.floor(Math.random() * 7) + 6

    /* ===============================
       🎯 STEP 2: LẤY POOL
    =============================== */
    const pool: QuestionWithChoices[] = await prisma.question.findMany({
      where: {
        stageId,
        isPublished: true,
        id: { notIn: usedIds }
      },
      include: {
        choices: true
      },
      take: LIMIT
    })

    if (!pool.length) {
      return Response.json({ done: true })
    }

    /* ===============================
       🎲 STEP 3: SHUFFLE XỊN
    =============================== */
    function shuffle<T>(arr: T[]): T[] {
      const clone = [...arr]
      for (let i = clone.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[clone[i], clone[j]] = [clone[j], clone[i]]
      }
      return clone
    }

    const shuffled = shuffle(pool)

    /* ===============================
       🧠 STEP 4: ANTI-REPEAT
    =============================== */
    const lastUsed = usedIds[usedIds.length - 1]

    const filtered = shuffled.filter(q => q.id !== lastUsed)

    const selectedQuestion =
      filtered.length > 0 ? filtered[0] : shuffled[0]

    if (!selectedQuestion) {
      return Response.json({ done: true })
    }

    /* ===============================
       🔥 STEP 5: PARSE FURIGANA
    =============================== */
    const parsedQuestion = await parseJapanese(selectedQuestion.question)
    

    const parsedChoices = await Promise.all(
      selectedQuestion.choices.map(async (c) => ({
        id: c.id,
        text: c.text,
        translation: c.translation || "",
        feedback: c.feedback || "",

        // ✅ sạch + đúng Prisma
        quality: c.quality,

        reading: await parseJapanese(c.text)
      }))
    )

    /* ===============================
       🚀 FINAL RESPONSE
    =============================== */
    return Response.json({
      id: selectedQuestion.id,
      question: selectedQuestion.question,
      translation: selectedQuestion.translation,
      reading: parsedQuestion,
      choices: parsedChoices
    })

  } catch (err: any) {
    console.error("SCENARIO ERROR:", err)

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
}