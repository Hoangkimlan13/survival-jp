import type { Progress } from "@/lib/progress"
import type { Scenario, Choice } from "./types"
import { GAME_CONFIG, type ChoiceQuality } from "./config"

/* ================= ANSWER ENGINE ================= */

export function handleAnswerEngine(
  progress: Progress,
  data: Scenario,
  choice: Choice
) {
  const quality: ChoiceQuality = choice.quality ?? "OK"

  const xpGain = GAME_CONFIG.XP[quality]

  // ✅ update pool (chuẩn engine mới)
  const newPool = [...progress.pool]
  const idx = newPool.findIndex(q => q.id === data.id)

  if (idx !== -1) {
    newPool[idx] = { ...newPool[idx], used: true }
  }

  const updated: Progress = {
    ...progress,
    pool: newPool,
    xp: progress.xp + xpGain,
    hp: quality === "BAD" ? progress.hp - 1 : progress.hp,
    streak: quality !== "BAD" ? progress.streak + 1 : 0,
    history: [
      ...(progress.history || []),
      {
        questionId: data.id,
        choiceId: choice.id,
        result: GAME_CONFIG.QUALITY_RESULT[quality],
        xpGain
      }
    ]
  }

  return {
    updated,
    xpGain,
    quality,
    result: GAME_CONFIG.QUALITY_RESULT[quality],
    effects: {
      confetti: GAME_CONFIG.CONFETTI[quality],
      shake: quality === "BAD"
    }
  }
}

/* ================= NEXT ENGINE ================= */

export function handleNextEngine(progress: Progress) {
  const nextTurn = progress.turn + 1

  if (nextTurn > progress.stageGoal) {
    return { type: "stage_end" }
  }

  return {
    type: "next",
    updatedProgress: {
      ...progress,
      turn: nextTurn
    }
  }
}

/* ================= ENDING ENGINE ================= */

export function calculateEndingEngine(progress: Progress) {
  const history = progress.history || []

  const total = history.length
  const good = history.filter(h => h.result === "GOOD").length

  const accuracy = total ? good / total : 0

  if (progress.hp <= 1 || accuracy < 0.4) return "bad"
  if (accuracy < 0.7) return "normal"
  return "good"
}