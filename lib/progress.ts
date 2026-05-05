// lib/progress.ts

import type { Scenario } from "@/src/game/types"

/* ================= LOG ================= */

export type ProgressLog = {
  questionId: number
  choiceId: number | "SKIP"   // 🔥 FIX 1
  result: "PERFECT" | "GOOD" | "OK" | "BAD" | "SKIP"  // 🔥 FIX 2 (đồng bộ engine)
  xpGain: number
}

/* ================= PROGRESS ================= */

export type Progress = {
  dayId: number
  stageId: number
  stageOrder?: number
  stageName?: string

  turn: number
  xp: number
  hp: number

  streak: number
  history: ProgressLog[]

  stageGoal: number
  usedStories?: number[]

  // 🔥 chỉ dùng 1 loại duy nhất
  pool: Scenario[]
  usedEndings?: number[]
  
  event?: any // Thêm field event để lưu trạng thái event
  
}

/* ================= DEFAULT ================= */

export function createDefaultProgress(): Progress {
  return {
    dayId: 1,
    stageId: 1,
    stageOrder: 1,
    stageName: "",

    turn: 1,
    xp: 0,
    hp: 5,

    streak: 0,
    history: [],

    stageGoal: 6,
    pool: [],
    usedStories: [],
    usedEndings: [],
    event: null
  }
}

/* ================= VALIDATE ================= */

function normalizeProgress(raw: any): Progress {
  const base = createDefaultProgress()

  return {
    ...base,
    ...raw,

    pool: Array.isArray(raw?.pool) ? raw.pool : [],
    history: Array.isArray(raw?.history) ? raw.history : [],
    usedStories: Array.isArray(raw?.usedStories) ? raw.usedStories : [],

    turn: Number(raw?.turn ?? base.turn),
    xp: Number(raw?.xp ?? base.xp),
    hp: Number(raw?.hp ?? base.hp),
    stageGoal: Number(raw?.stageGoal ?? base.stageGoal),
    stageOrder: Number(raw?.stageOrder ?? base.stageOrder),
    event: raw?.event ?? null
  }
}

/* ================= STORAGE ================= */

export function getProgress(): Progress {
  try {
    const data = localStorage.getItem("progress")

    if (!data) {
      const init = createDefaultProgress()
      localStorage.setItem("progress", JSON.stringify(init))
      return init
    }

    const parsed = JSON.parse(data)

    // 🔥 safety normalize
    return normalizeProgress(parsed)
  } catch (e) {
    const init = createDefaultProgress()
    localStorage.setItem("progress", JSON.stringify(init))
    return init
  }
}

export function setProgress(p: Progress) {
  try {
    localStorage.setItem("progress", JSON.stringify(p))
  } catch {}
}

export function clearProgress() {
  localStorage.removeItem("progress")
}