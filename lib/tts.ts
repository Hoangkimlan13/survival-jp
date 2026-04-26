let voices: SpeechSynthesisVoice[] = []
let voicesReady: Promise<void> | null = null

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

/* ================= DETECT LANGUAGE ================= */
function detectLang(text: string): string {
  // Nhật
  if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(text)) return "ja-JP"

  // Việt (có dấu đặc trưng)
  if (/[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text)) {
    return "vi-VN"
  }

  // Anh
  if (/[a-zA-Z]/.test(text)) return "en-US"

  return "en-US"
}

/* ================= GET BEST VOICE ================= */
function getBestVoice(lang: string) {
  let voice =
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.startsWith(lang.split("-")[0]))

  if (lang === "vi-VN") {
    voice =
      voices.find(v => v.lang.includes("vi") && v.name.toLowerCase().includes("google")) ||
      voices.find(v => v.lang.includes("vi"))
  }

  if (!voice) {
    voice = voices.find(v => v.lang.includes("en")) || voices[0]
  }

  return voice
}

/* ================= MAIN SPEAK ================= */
export async function speak(text: string, opts?: {
  rate?: number
  pitch?: number
}) {
  if (!("speechSynthesis" in window)) return

  await initVoices() // 🔥 FIX CHÍNH

  const lang = detectLang(text)

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang

  utter.rate = opts?.rate ?? (
    lang === "ja-JP" ? 0.85 :
    lang === "vi-VN" ? 1 :   // ✅ tiếng Việt nhanh bình thường
    1
  )

  utter.pitch = opts?.pitch ?? (
    lang === "vi-VN" ? 1.05 : 1
  )

  const voice = getBestVoice(lang)
  if (voice) utter.voice = voice

  speechSynthesis.cancel()
  speechSynthesis.speak(utter)

  return utter
}