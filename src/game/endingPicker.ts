import type { Progress } from "@/lib/progress"
import type { Ending } from "./types"

export function pickEnding(
  endings: Ending[],
  progress: Progress
): Ending {

  if (!endings || endings.length === 0) {
    throw new Error("No endings found")
  }

  const used = new Set(progress.usedEndings ?? [])

  const available = endings.filter(e => !used.has(e.id))

  if (available.length === 0) {
    return endings[Math.floor(Math.random() * endings.length)]
  }

  return available[Math.floor(Math.random() * available.length)]
}