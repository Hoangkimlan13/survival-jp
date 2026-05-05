import type { Progress } from "@/lib/progress"
import type { Scenario } from "./types"
import { getStoryTrigger } from "./story"

export const api = {
  /* ================= SCENARIO LIST ================= */
  async getScenarioList(progress: Progress & { force?: number }): Promise<Scenario[]> {
    const res = await fetch(`/api/scenario?stageId=${progress.stageId}${progress.force ? `&force=${progress.force}` : ''}`)

    if (!res.ok) {
      throw new Error("Failed to fetch scenario list")
    }

    return res.json()
  },

  /* ================= STAGES ================= */
  async getStages(dayId: number) {
    const res = await fetch(`/api/stages?dayId=${dayId}`)
    if (!res.ok) throw new Error("Failed to fetch stages")
    return res.json()
  },

  async getDay(dayId: number) {
    const res = await fetch(`/api/days`)
    if (!res.ok) throw new Error("Failed to fetch day info")
    const days = await res.json()
    return Array.isArray(days) ? days.find((day: any) => Number(day.id) === Number(dayId)) : null
  },

/* ================= STORIES ================= */
async getStories(progress: Progress, blockStory = false) {
  if (blockStory) return []

  const trigger = getStoryTrigger(progress)

  const res = await fetch(
    `/api/story?stageId=${progress.stageId}&dayId=${progress.dayId}&trigger=${trigger}`
  )

  if (!res.ok) return []

  const data = await res.json()

  return data ? [data] : []
},

  /* ================= ENDING ================= */
  async getEnding(dayId: number, type: "good" | "normal" | "bad") {
    const res = await fetch(`/api/ending?dayId=${dayId}&type=${type}`)
    if (!res.ok) throw new Error("Failed to fetch ending")
    return res.json()
  },


  async getAllDaysWithStages() {
    const res = await fetch("/api/days-with-stages")

    if (!res.ok) {
      throw new Error("Failed to fetch days")
    }

    return res.json()
  }
  
}