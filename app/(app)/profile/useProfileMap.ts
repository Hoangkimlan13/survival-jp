import type { Day, MapNode } from "./types"


export function generatePathsByDay(nodes: MapNode[]) {
  const paths: string[] = []

  const groups = new Map<number, any[]>()

  // group theo day
  nodes.forEach(n => {
    if (n.type !== "stage") return

    if (!groups.has(n.day.id)) {
      groups.set(n.day.id, [])
    }

    groups.get(n.day.id)!.push(n)
  })

  // tạo path riêng cho từng day
  groups.forEach(stages => {
    if (!stages.length) return

    let d = `M ${stages[0].x} ${stages[0].y}`

    for (let i = 1; i < stages.length; i++) {
      const prev = stages[i - 1]
      const cur = stages[i]

      const midY = (prev.y + cur.y) / 2

      d += ` C 
        ${prev.x} ${midY}, 
        ${cur.x} ${midY}, 
        ${cur.x} ${cur.y}`
    }

    paths.push(d)
  })

  return paths
}


/* ================= FIX MISSING FUNCTION ================= */
export function getNodeState(node: MapNode, progress: any, days: Day[]) {
  const currentDay = days.find(d => d.id === progress.dayId)
  const currentStage = currentDay?.stages.find(s => s.id === progress.stageId)

  const isStage = node.type === "stage"

  const isPassed =
    isStage &&
    (
      node.day.order < (currentDay?.order ?? 0) ||
      (
        node.day.order === currentDay?.order &&
        node.stage.order < (currentStage?.order ?? 0)
      )
    )

  const isCurrent =
    isStage &&
    node.stage.id === progress.stageId

  return {
    status: isCurrent
      ? "current"
      : isPassed
      ? "passed"
      : "locked",

    isCurrent,
    canEnter: isPassed || isCurrent,
    isReplayable: isPassed
  }
}
