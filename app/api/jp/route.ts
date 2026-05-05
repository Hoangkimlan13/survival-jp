export const runtime = "edge"

type ReadingItem = {
  text: string
  reading?: string
}

const cache = new Map<string, ReadingItem[]>()

const APP_ID = process.env.YAHOO_APP_ID!

/* ================= UTIL ================= */

// 🔥 convert katakana → hiragana
function katakanaToHiragana(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}

/* ================= FALLBACK ================= */

function fallbackParse(text: string): ReadingItem[] {
  return [{ text }]
}

/* ================= YAHOO ================= */

async function fetchYahoo(text: string): Promise<ReadingItem[]> {
  try {
    const res = await fetch(
      "https://jlp.yahooapis.jp/FuriganaService/V2/furigana",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Yahoo AppID: " + APP_ID
        },
        body: JSON.stringify({
          id: "1",
          jsonrpc: "2.0",
          method: "jlp.furiganaservice.furigana",
          params: { q: text }
        })
      }
    )

    if (!res.ok) return fallbackParse(text)

    const json = await res.json()
    const words = json?.result?.word || []

    return words.map((w: any) => ({
      text: w.surface,
      reading: w.furigana
        ? katakanaToHiragana(w.furigana)
        : undefined
    }))
  } catch {
    return fallbackParse(text)
  }
}

/* ================= HANDLER ================= */

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 🔥 hỗ trợ BOTH: text và texts
    const texts: string[] = body?.texts
      ? body.texts
      : body?.text
      ? [body.text]
      : []

    if (!texts.length) {
      return Response.json({})
    }

    const unique = [...new Set(texts)]
    const result: Record<string, ReadingItem[]> = {}

    await Promise.all(
      unique.map(async (text) => {
        if (!text) return

        // ✅ cache memory
        if (cache.has(text)) {
          result[text] = cache.get(text)!
          return
        }

        const parsed = await fetchYahoo(text)

        cache.set(text, parsed)
        result[text] = parsed
      })
    )

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        // 🔥 CDN cache cực mạnh
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800"
      }
    })
  } catch (err) {
    return Response.json({}, { status: 500 })
  }
}

/* ================= TEST ================= */

export async function GET() {
  return Response.json({
    ok: true,
    message: "JP API (Edge + Batch + Hiragana) working"
  })
}