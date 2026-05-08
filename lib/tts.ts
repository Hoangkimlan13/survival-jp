let voices: SpeechSynthesisVoice[] = []
let voicesReady: Promise<void> | null = null

const JAPANESE_SPEECH_RE =
  /[\u3040-\u30ff\u3400-\u9fff\u3000-\u303f\uff01-\uff60ー々〆〤]+/g

function getSynth() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null
  }

  return window.speechSynthesis
}

function loadVoices() {
  const synth = getSynth()
  if (!synth) return []

  voices = synth.getVoices()
  return voices
}

function initVoices() {
  const synth = getSynth()
  if (!synth) return Promise.resolve()

  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      if (loadVoices().length > 0) {
        resolve()
        return
      }

      const done = () => {
        loadVoices()
        resolve()
      }

      synth.addEventListener?.("voiceschanged", done, { once: true })
      synth.onvoiceschanged = done

      // Safari iOS may not fire voiceschanged before the first gesture.
      window.setTimeout(done, 300)
    })
  }

  return voicesReady
}

export function prepareSpeechSynthesis() {
  const synth = getSynth()
  if (!synth) return

  loadVoices()
  void initVoices()

  if (synth.paused) {
    synth.resume()
  }
}

export function extractJapaneseSpeechText(text: string) {
  if (!text) return ""

  return (text.match(JAPANESE_SPEECH_RE) ?? [])
    .join("")
    .replace(/\s+/g, "")
    .trim()
}

export function hasJapaneseSpeechText(text: string) {
  return extractJapaneseSpeechText(text).length > 0
}

function getBestJapaneseVoice() {
  const list = voices.length ? voices : loadVoices()
  const jaVoices = list.filter(v => v.lang.toLowerCase().startsWith("ja"))

  if (!jaVoices.length) return null

  const preferredNames = [
    "kyoko",
    "nanami",
    "siri",
    "premium",
    "enhanced",
    "google"
  ]

  for (const name of preferredNames) {
    const found = jaVoices.find(v => v.name.toLowerCase().includes(name))
    if (found) return found
  }

  return jaVoices.find(v => v.localService) ?? jaVoices[0]
}

export async function speak(
  text: string,
  opts?: { rate?: number; pitch?: number },
  onEnd?: () => void
) {
  const synth = getSynth()
  if (!synth) {
    onEnd?.()
    return
  }

  prepareSpeechSynthesis()

  const japaneseText = extractJapaneseSpeechText(text)
  if (!japaneseText) {
    onEnd?.()
    return
  }

  synth.cancel()
  synth.resume()
  void initVoices()

  const utter = new SpeechSynthesisUtterance(japaneseText)

  utter.lang = "ja-JP"
  utter.rate = opts?.rate ?? 0.78
  utter.pitch = opts?.pitch ?? 1.08
  utter.volume = 1

  const voice = getBestJapaneseVoice()
  if (voice) utter.voice = voice

  utter.onend = () => {
    onEnd?.()
  }

  utter.onerror = () => {
    onEnd?.()
  }

  synth.speak(utter)

  window.setTimeout(() => {
    if (synth.paused) synth.resume()
  }, 120)
}

export function stopSpeak() {
  const synth = getSynth()
  if (!synth) return

  synth.cancel()
}
