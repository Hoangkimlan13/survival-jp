// lib/haptic.ts

export type HapticLevel = "light" | "medium" | "heavy" | "error" | "success"

const isIOS = () =>
  typeof window !== "undefined" &&
  /iPhone|iPad|iPod/i.test(navigator.userAgent)

const canVibrate = () =>
  typeof navigator !== "undefined" && "vibrate" in navigator

/* ================= CORE ================= */

export function haptic(level: HapticLevel) {
  if (typeof window === "undefined") return

  // ===== ANDROID / PC =====
  if (canVibrate()) {
    const nav = navigator as any

    switch (level) {
      case "light":
        nav.vibrate(10)
        break
      case "medium":
        nav.vibrate(40)
        break
      case "heavy":
        nav.vibrate([0, 60, 40, 120])
        break
      case "error":
        nav.vibrate([0, 80, 40, 80])
        break
      case "success":
        nav.vibrate([0, 30, 20, 30])
        break
    }

    return
  }

  // ===== IOS FALLBACK (REAL GAME FEEL) =====
  iosHaptic(level)
}

/* ================= IOS FAKE HAPTIC ================= */

function iosHaptic(level: HapticLevel) {
  const el = document.body

  let className = ""

  switch (level) {
    case "light":
      className = "haptic-light"
      break
    case "medium":
      className = "haptic-medium"
      break
    case "heavy":
      className = "haptic-heavy"
      break
    case "error":
      className = "haptic-error"
      break
    case "success":
      className = "haptic-success"
      break
  }

  el.classList.add(className)

  setTimeout(() => {
    el.classList.remove(className)
  }, 150)
}


export function playTick(level: HapticLevel) {
  if (typeof window === "undefined") return

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  let freq = 200

  switch (level) {
    case "light":
      freq = 220
      break
    case "medium":
      freq = 330
      break
    case "heavy":
      freq = 440
      break
    case "error":
      freq = 120
      break
    case "success":
      freq = 520
      break
  }

  osc.frequency.value = freq
  osc.type = "sine"

  gain.gain.value = 0.05

  osc.start()

  setTimeout(() => {
    osc.stop()
    ctx.close()
  }, 80)
}