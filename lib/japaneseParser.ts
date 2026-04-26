export const runtime = "nodejs"
import kuromoji from "kuromoji"

type Token = {
  surface_form: string
  reading: string
  basic_form: string
  pos: string
}

let tokenizer: any = null

export async function initJapaneseParser() {
  if (tokenizer) return tokenizer

  tokenizer = await new Promise((resolve, reject) => {
    kuromoji
      .builder({
        dicPath: "node_modules/kuromoji/dict"
      })
      .build((err: any, t: any) => {
        if (err) reject(err)
        else resolve(t)
      })
  })

  return tokenizer
}

/**
 * ===============================
 * DUOLINGO-STYLE PARSER (FIXED)
 * ===============================
 */
export async function parseJapanese(text: string) {
  const t = await initJapaneseParser()

  const tokens = t.tokenize(text)

  return tokens
    // ❌ bỏ dấu câu hoàn toàn
    .filter((tk: any) => tk.pos !== "記号")

    .map((tk: any) => {
      const surface = tk.surface_form

      // 🔥 chỉ convert reading nếu là Kanji
      const hasKanji = /[一-龯]/.test(surface)

      return {
        text: surface,

        // ✔ chỉ giữ reading nếu cần (KANJI / VERB)
        reading: hasKanji
          ? (tk.reading && tk.reading !== surface ? katakanaToHiragana(tk.reading) : "")
          : "",

        base: tk.basic_form,
        pos: tk.pos
      }
    })
}

/**
 * 🔥 FIX KATAKANA → HIRAGANA (QUAN TRỌNG)
 * Kuromoji trả Katakana → convert lại Hiragana cho đẹp
 */
function katakanaToHiragana(str: string) {
  return str.replace(/[\u30a1-\u30f6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  )
}