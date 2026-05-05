// src/game/effects.ts

let confettiFn: any

export const fireConfetti = async (config: any) => {
  if (!confettiFn) {
    confettiFn = (await import("canvas-confetti")).default
  }
  confettiFn(config)
}

export const addScreenShake = () => {
  if (typeof window === "undefined") return
  document.body.classList.add("dangerShake")
}

export const removeScreenShake = () => {
  if (typeof window === "undefined") return
  document.body.classList.remove("dangerShake")
}

export const vibrate = (pattern: number | number[] = 50) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}