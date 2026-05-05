import "server-only"
import kuromoji from "kuromoji"
import path from "path"

/* ================= TYPES ================= */
type Token = {
  surface_form: string
  reading: string
  basic_form: string
  pos: string
}

export type ReadingItem = {
  text: string
  reading: string
  base: string
  pos: string
}

/* ================= SINGLETON ================= */
let tokenizer: any = null
let initPromise: Promise<any> | null = null

/* ================= INIT (FIXED) ================= */
export async function initJapaneseParser() {
  if (tokenizer) return tokenizer

  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      // ❗ FIX QUAN TRỌNG: dùng absolute path (KHÔNG dùng string relative)
      const dicPath = path.join(
        process.cwd(),
        "node_modules/kuromoji/dict"
      )

      kuromoji
        .builder({ dicPath })
        .build((err: any, t: any) => {
          if (err) return reject(err)
          tokenizer = t
          resolve(t)
        })
    })
  }

  return initPromise
}

/* ================= MAIN PARSER ================= */
const cache = new Map<string, ReadingItem[]>()

export async function parseJapanese(text: string) {
  if (cache.has(text)) return cache.get(text)!

  const tokenizer = await initJapaneseParser()
  const tokens = tokenizer.tokenize(text)

  const result: ReadingItem[] = []

  for (const tk of tokens as Token[]) {
    if (tk.pos === "記号") continue

    const surface = tk.surface_form
    const isKanji = /[一-龯]/.test(surface)

    let reading = ""

    if (isKanji && tk.reading) {
      reading = katakanaToHiragana(tk.reading)
    }

    result.push({
      text: surface,
      reading,
      base: tk.basic_form,
      pos: tk.pos
    })
  }

  const merged = mergeTokens(result)

  cache.set(text, merged)

  return merged
}

/* ================= MERGE ================= */
function mergeTokens(tokens: ReadingItem[]) {
  const merged: ReadingItem[] = []

  for (const t of tokens) {
    const last = merged[merged.length - 1]

    if (last && shouldMerge(last.text, t.text)) {
      last.text += t.text
      last.reading += t.reading
    } else {
      merged.push({ ...t })
    }
  }

  return merged
}

function shouldMerge(a: string, b: string) {
  return /^[ぁ-んー]+$/.test(b) || /^[、。！？]$/.test(b)
}

/* ================= UTIL ================= */
function katakanaToHiragana(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, (m) =>
    String.fromCharCode(m.charCodeAt(0) - 0x60)
  )
}