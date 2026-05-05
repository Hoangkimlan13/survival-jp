export function isSoundEnabled() {
  if (typeof window === "undefined") return false
  return localStorage.getItem("sound") === "on"
}

export function setSoundEnabled(v: boolean) {
  if (typeof window === "undefined") return
  localStorage.setItem("sound", v ? "on" : "off")
}