import kuromoji from "kuromoji"
import { toHiragana } from "wanakana"

type ReadingItem = {
  text: string
  reading?: string
}

const KANJI_RE = /[\u4e00-\u9faf]/

function normalizeReading(
  text: string,
  reading?: ReadingItem[]
): ReadingItem[] {
  if (reading?.length) return reading

  return [{ text }]
}

/* ================= KUROMOJI ================= */

const builder = kuromoji.builder({
  dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict"
})

let tokenizer: any = null

export async function initTokenizer() {
  if (tokenizer) return tokenizer

  tokenizer = await new Promise<any>((resolve, reject) => {
    builder.build((err: Error | null, t: any) => {
      if (err) reject(err)
      else resolve(t)
    })
  })

  return tokenizer
}

/* ================= PARSER ================= */

export async function parseJapanese(text: string): Promise<ReadingItem[]> {
  const t = await initTokenizer()
  const tokens = t.tokenize(text)

  return tokens.map((tk: any) => {
    const surface = tk.surface_form

    // 🔥 KUROMOJI reading (katakana → hiragana)
    const reading =
      tk.reading && tk.reading !== "*"
        ? toHiragana(tk.reading)
        : undefined

    return {
      text: surface,
      reading
    }
  })
}

/* ================= SAFE WRAPPER ================= */

export async function safeParseJapanese(text: string, fallback?: ReadingItem[]) {
  try {
    const result = await parseJapanese(text)
    return normalizeReading(text, result)
  } catch (e) {
    return normalizeReading(text, fallback)
  }
}