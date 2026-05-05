import type { Progress } from "@/lib/progress"
import type { EndingType } from "./types"

/* ================= SCORE ANALYSIS ================= */

export function analyzeEnding(progress: Progress) {
  return {
    hp: progress.hp,
    streak: progress.streak,
    successRate: 0.7
  }
}

export function getEndingType(score: any): EndingType {
  if (score.hp <= 0) return "bad"
  if (score.streak > 10) return "good"
  return "normal"
}