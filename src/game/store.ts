import type { Scenario } from "@/src/game/types"
import type { Progress } from "@/lib/progress"

export type GameState = {
  progress: Progress
  current: Scenario | null
  next: Scenario | null
  loading: boolean
}