let voices: SpeechSynthesisVoice[] = []
let voicesReady: Promise<void> | null = null

let currentUtter: SpeechSynthesisUtterance | null = null

function initVoices() {
  if (typeof window === "undefined") return

  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const v = speechSynthesis.getVoices()

      if (v.length > 0) {
        voices = v
        resolve()
      } else {
        speechSynthesis.onvoiceschanged = () => {
          voices = speechSynthesis.getVoices()
          resolve()
        }
      }
    })
  }

  return voicesReady
}

/* ================= LANGUAGE DETECT PRO ================= */
function detectLang(text: string): "ja-JP" | "vi-VN" | "en-US" {
  // Ưu tiên phát hiện tiếng Nhật trước
  if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(text)) return "ja-JP"

  if (/[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text))
    return "vi-VN"

  if (/[a-zA-Z]/.test(text)) return "en-US"

  return "en-US"
}

/* ================= FILTER JAPANESE ONLY ================= */
function extractJapanese(text: string): string {
  if (!text) return ""

  const matches = text.match(/[\u3040-\u30ff\u4e00-\u9fafー]+/g)

  if (!matches) return ""

  return matches.join("").trim()
}
/* ================= SMART VOICE PICK ================= */
function getBestVoice(lang: string) {
  const list = voices

  const exact = list.find(v => v.lang === lang)
  if (exact) return exact

  const prefix = list.find(v => v.lang.startsWith(lang.split("-")[0]))
  if (prefix) return prefix

  // 🇻🇳 ưu tiên Google tiếng Việt
  if (lang === "vi-VN") {
    return (
      list.find(v => v.name.toLowerCase().includes("google") && v.lang.includes("vi")) ||
      list.find(v => v.lang.includes("vi"))
    )
  }

  // 🇯🇵 ưu tiên Japanese natural voice
  if (lang === "ja-JP") {
    return (
      list.find(v => v.name.toLowerCase().includes("google")) ||
      list.find(v => v.lang.includes("ja"))
    )
  }

  return list[0]
}

/* ================= SPLIT MIX TEXT ================= */
function splitMixedText(text: string) {
  // tách nhẹ để JP + VI không bị đọc sai
  return text
    .replace(/([。！？])/g, "$1|")
    .split("|")
    .filter(Boolean)
}

/* ================= MAIN SPEAK PRO ================= */
export async function speak(
  text: string,
  opts?: { rate?: number; pitch?: number },
  onEnd?: () => void
) {
  if (!("speechSynthesis" in window)) return

  await initVoices()

  // 🔥 STOP toàn bộ audio cũ
  speechSynthesis.cancel()
  currentUtter = null

  // 🎌 Chỉ phát âm phần tiếng Nhật để tập trung học tiếng Nhật
  const japaneseText = extractJapanese(text)

  if (!japaneseText) {
    onEnd?.()
    return
  }

  const parts = japaneseText.split(" ")

  let index = 0

  const playNext = () => {
    if (index >= parts.length) {
      onEnd?.()
      return
    }

    const chunk = parts[index++]

    const utter = new SpeechSynthesisUtterance(chunk)

    currentUtter = utter

    // 🔥 LUÔN là tiếng Nhật
    utter.lang = "ja-JP"

    utter.rate = opts?.rate ?? 0.85
    utter.pitch = opts?.pitch ?? 1

    const voice = getBestVoice("ja-JP")
    if (voice) utter.voice = voice

    utter.onend = playNext

    speechSynthesis.speak(utter)
  }

  playNext()
}

/* ================= STOP SPEAK ================= */
export function stopSpeak() {
  if (!("speechSynthesis" in window)) return
  speechSynthesis.cancel()
  currentUtter = null
}