export function vibrate(pattern: number | number[], el?: HTMLElement) {
  if (typeof window === "undefined") return

  const nav = navigator as any

  // Android
  if (nav.vibrate) {
    nav.vibrate(pattern)
    return
  }

  // 🍎 iOS fallback (UI haptic)
  if (el) {
    el.classList.remove("ios-haptic")
    void el.offsetWidth
    el.classList.add("ios-haptic")
  }
}


export function iosHapticFallback(el?: HTMLElement) {
  if (!el) return

  el.style.animation = "iosShake 0.25s ease"

  setTimeout(() => {
    el.style.animation = ""
  }, 250)
}

export function haptic(level: "light" | "medium" | "heavy", el?: HTMLElement) {
  const nav = navigator as any

  const canVibrate = typeof nav !== "undefined" && nav.vibrate

  // Android / hỗ trợ thật
  if (canVibrate) {
    if (level === "light") nav.vibrate(10)
    if (level === "medium") nav.vibrate(40)
    if (level === "heavy") nav.vibrate([0, 80, 40, 120])
    return
  }

  // 🍎 fallback iOS
  if (el) {
    iosHapticFallback(el)
  }
}