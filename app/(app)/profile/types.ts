export type Stage = {
  id: number
  name: string
  order: number
  dayId: number
  isPublished: boolean
}

export type Day = {
  id: number
  name: string
  order: number
  isPublished: boolean
  stages: Stage[]
}

export type MapNode =
  | {
      type: "day"
      x: number
      y: number
      day: Day
    }
  | {
      type: "stage"
      x: number
      y: number
      stage: Stage
      day: Day
      lane: -1 | 1
      size: "small" | "big" // 🔥 stage hiện tại to hơn
    }

    
export type Progress = {
  dayId: number
  stageId: number
  xp: number
  stageProgress?: {
    [stageId: number]: {
      current: number
      total: number
    }
  }
}