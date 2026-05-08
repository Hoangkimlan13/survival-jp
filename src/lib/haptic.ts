export type HapticLevel = "light" | "medium" | "heavy" | "error" | "success"
export type AnswerHaptic = "PERFECT" | "GOOD" | "OK" | "BAD" | "SKIP"

const PATTERNS: Record<HapticLevel, number | number[]> = {
  light: 12,
  medium: 32,
  heavy: [0, 55, 35, 90],
  error: [0, 75, 45, 110],
  success: [0, 24, 22, 34]
}

const ANSWER_LEVELS: Record<AnswerHaptic, HapticLevel> = {
  PERFECT: "success",
  GOOD: "medium",
  OK: "light",
  BAD: "error",
  SKIP: "heavy"
}

function getNavigatorWithVibrate() {
  if (typeof navigator === "undefined") return null

  return navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean
  }
}

function canVibrate() {
  return typeof getNavigatorWithVibrate()?.vibrate === "function"
}

function triggerVisualFallback(level: HapticLevel) {
  if (typeof document === "undefined") return

  const className = `haptic-${level}`
  const el = document.body

  el.classList.remove(className)
  void el.offsetWidth
  el.classList.add(className)

  window.setTimeout(() => {
    el.classList.remove(className)
  }, 220)
}

function playTick(level: HapticLevel) {
  if (typeof window === "undefined") return

  const AudioCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioCtor) return

  try {
    const ctx = new AudioCtor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const freq: Record<HapticLevel, number> = {
      light: 220,
      medium: 320,
      heavy: 180,
      error: 110,
      success: 520
    }

    osc.type = "sine"
    osc.frequency.value = freq[level]

    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.08)

    window.setTimeout(() => {
      void ctx.close()
    }, 120)
  } catch {
    // Some browsers block AudioContext outside user gestures.
  }
}

export function haptic(level: HapticLevel) {
  if (typeof window === "undefined") return false

  const nav = getNavigatorWithVibrate()

  if (canVibrate()) {
    return nav?.vibrate?.(PATTERNS[level]) ?? false
  }

  triggerVisualFallback(level)
  playTick(level)
  return false
}

export function answerHaptic(result: AnswerHaptic) {
  return haptic(ANSWER_LEVELS[result])
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
