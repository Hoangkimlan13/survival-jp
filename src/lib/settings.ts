let soundCache: boolean | null = null

export function isSoundEnabled() {
  if (typeof window === "undefined") return false
  if (soundCache !== null) return soundCache

  soundCache = localStorage.getItem("sound") === "on"
  return soundCache
}

export function setSoundEnabled(v: boolean) {
  if (typeof window === "undefined") return

  soundCache = v
  localStorage.setItem("sound", v ? "on" : "off")
}