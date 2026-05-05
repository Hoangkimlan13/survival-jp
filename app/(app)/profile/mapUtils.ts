import type { Day, MapNode } from "./types"

const seed = 42
const rand = (n: number) => {
  const x = Math.sin(n + seed) * 10000
  return x - Math.floor(x)
}

export function buildMapNodes(days: Day[]): MapNode[] {
  const nodes: MapNode[] = []

  const CENTER_X = 215
  const MAP_START_PADDING = 45
  let globalY = MAP_START_PADDING

  days.forEach((day, dayIndex) => {
    const clusterStartY = globalY

    // 🔥 lane ban đầu
    let lane: -1 | 1 = rand(dayIndex) > 0.5 ? 1 : -1

    // 🔥 zigzag block (2–3 node mỗi bên)
    let blockSize = 2 + Math.floor(rand(dayIndex) * 2)
    let stepCount = 0

    // 🔥 QUAN TRỌNG: phải có y
    let y = clusterStartY

    day.stages.forEach((stage, i) => {
      // ===== đổi lane theo block =====
      if (stepCount >= blockSize) {
        lane *= -1
        stepCount = 0
        blockSize = 2 + Math.floor(rand(dayIndex * 100 + i) * 2)
      }

      stepCount++

      // ===== random X (không lặp giữa các day) =====
      const offsetX = 60 + rand(dayIndex * 100 + i) * 50
      const x = CENTER_X + lane * offsetX

      const STAGE_GAP = 120        // khoảng cách giữa stage
      const FIRST_STAGE_GAP = 95 // từ DAY → stage đầu

      // ===== spacing Y =====
      if (i === 0) {
        y += FIRST_STAGE_GAP
      } else {
        y += STAGE_GAP
      }

      nodes.push({
        type: "stage",
        x,
        y,
        stage,
        day,
        lane,
        size: i % 4 === 3 ? "big" : "small",
        clusterStartY
      } as any)
    })

    // ===== gap giữa 2 day =====
    const BASE_GAP = 95
    globalY = y + BASE_GAP
  })

  return nodes
}