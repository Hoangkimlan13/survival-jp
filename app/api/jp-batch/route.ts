export const runtime = "edge"

type ReadingItem = {
  text: string
  reading?: string
}

const cache = new Map<string, ReadingItem[]>()

const APP_ID = process.env.YAHOO_APP_ID!
const KANJI_RE = /[\u4e00-\u9faf]/

/* ================= SIMPLE FALLBACK ================= */
// 👉 nếu Yahoo fail → vẫn có reading basic
function fallbackParse(text: string): ReadingItem[] {
  return [{ text }] // không furigana nhưng không crash
}

function katakanaToHiragana(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
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

    return words.map((w: any) => {
    const surface = w.surface
    const hira = w.furigana
        ? katakanaToHiragana(w.furigana)
        : undefined

    const hasKanji = KANJI_RE.test(surface)

    const shouldShow =
        hasKanji &&
        hira &&
        hira !== surface // 🔥 FIX QUAN TRỌNG

    return {
        text: surface,
        reading: shouldShow ? hira : undefined
    }
    })
  } catch {
    return fallbackParse(text)
  }
}
/* ================= HANDLER ================= */

export async function POST(req: Request) {
  try {
    const body = await req.json() as { texts?: string[] }

    const texts = Array.isArray(body.texts) ? body.texts : []

    if (!texts.length) {
      return Response.json({})
    }

    const unique = [...new Set(texts)]
    const result: Record<string, ReadingItem[]> = {}

    await Promise.all(
      unique.map(async (text: string) => {
        if (!text) return

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
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800"
      }
    })
  } catch {
    return Response.json({}, { status: 500 })
  }
}