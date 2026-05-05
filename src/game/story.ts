import type { Progress } from "@/lib/progress"

export function getStoryTrigger(progress: Progress) {
  const { hp, streak, history } = progress

  const last = history[history.length - 1]?.result

  const recentBad = history.slice(-3).filter(h => h.result === "BAD").length

  /* ================= CRITICAL ================= */

  if (hp <= 1) return "CRITICAL"

  if (recentBad >= 2) return "BAD_STREAK"

  /* ================= LAST ANSWER ================= */

  if (last === "BAD") return "BAD"

  if (last === "PERFECT") {
    if (streak >= 7) return "COMBO_3"
    if (streak >= 4) return "COMBO"
    return "PERFECT"
  }

  if (last === "GOOD") {
    if (streak >= 5) return "COMBO"
    return "GOOD"
  }

  if (last === "OK") return "OK"

  if (last === "SKIP") return undefined

  return "NORMAL"
}