export const runtime = "edge"

type ReadingItem = {
  text: string
  reading?: string
}

type YahooWord = {
  surface?: string
  furigana?: string
}

const cache = new Map<string, ReadingItem[]>()

const APP_ID = process.env.YAHOO_APP_ID!
const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u9fff]/
const KANJI_RE = /[\u3400-\u9fff]/
const JAPANESE_PUNCTUATION_RE = /[\u3000-\u303f\uff01-\uff60ー々〆〤]/

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

function isJapaneseCore(char: string) {
  return JAPANESE_RE.test(char)
}

function isJapaneseTail(char: string) {
  return isJapaneseCore(char) || JAPANESE_PUNCTUATION_RE.test(char)
}

function splitMixedText(text: string) {
  const segments: { text: string; japanese: boolean }[] = []
  let index = 0

  while (index < text.length) {
    const start = index
    const japanese = isJapaneseCore(text[index])

    if (japanese) {
      index += 1
      while (index < text.length && isJapaneseTail(text[index])) {
        index += 1
      }
    } else {
      index += 1
      while (index < text.length && !isJapaneseCore(text[index])) {
        index += 1
      }
    }

    segments.push({ text: text.slice(start, index), japanese })
  }

  return segments
}

function shouldShowReading(surface: string, reading?: string) {
  return Boolean(
    reading &&
    KANJI_RE.test(surface) &&
    reading !== surface
  )
}

function alignWordsToText(text: string, words: ReadingItem[]) {
  const result: ReadingItem[] = []
  let cursor = 0

  for (const word of words) {
    if (!word.text) continue

    const foundAt = text.indexOf(word.text, cursor)

    if (foundAt === -1) {
      result.push(word)
      continue
    }

    if (foundAt > cursor) {
      result.push({ text: text.slice(cursor, foundAt) })
    }

    result.push(word)
    cursor = foundAt + word.text.length
  }

  if (cursor < text.length) {
    result.push({ text: text.slice(cursor) })
  }

  return result
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
    const words = (json?.result?.word || []) as YahooWord[]

    if (!words.length) return fallbackParse(text)

    const parsed = words
      .map((word) => {
        const surface = word.surface || ""
        const reading = word.furigana
          ? katakanaToHiragana(word.furigana)
          : undefined

        return {
          text: surface,
          reading: shouldShowReading(surface, reading) ? reading : undefined
        }
      })
      .filter(item => item.text)

    return alignWordsToText(text, parsed)
  } catch {
    return fallbackParse(text)
  }
}

async function parseText(text: string) {
  if (!JAPANESE_RE.test(text)) return fallbackParse(text)

  const parts = await Promise.all(
    splitMixedText(text).map(segment => (
      segment.japanese
        ? fetchYahoo(segment.text)
        : fallbackParse(segment.text)
    ))
  )

  return parts.flat()
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

        const parsed = await parseText(text)

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
