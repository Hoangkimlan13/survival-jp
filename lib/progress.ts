// lib/progress.ts

export type Progress = {
  dayId: number
  stageId: number
  turn: number
  xp: number
  hp: number
  used: number[]
  streak: number
}

export function getProgress(): Progress | null {
  try {
    const raw = localStorage.getItem("progress")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setProgress(p: Progress) {
  localStorage.setItem("progress", JSON.stringify(p))
}

export function clearProgress() {
  localStorage.removeItem("progress")
}