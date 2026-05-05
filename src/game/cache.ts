// src/game/cache.ts

import type { Scenario } from "./types"

/* ================= MEMORY ================= */

let scenarioCache: Scenario[] = []
let stageCache: any[] = []

/* ================= CACHE API ================= */

export const cache = {
  /* SCENARIO LIST */
  setScenarios: (data: Scenario[]) => {
    scenarioCache = data
  },

  getScenarios: () => {
    return scenarioCache
  },

  clearScenarios: () => {
    scenarioCache = []
  },

  /* STAGE */
  getStages: () => {
    return stageCache
  },

  setStages: (stages: any[]) => {
    stageCache = stages
  },

  clearStages: () => {
    stageCache = []
  }
}