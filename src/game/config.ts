// src/game/config.ts

export type ChoiceQuality = "PERFECT" | "GOOD" | "OK" | "BAD"

export const QUALITY_RESULT: Record<ChoiceQuality, ChoiceQuality> = {
  PERFECT: "PERFECT",
  GOOD: "GOOD",
  OK: "OK",
  BAD: "BAD"
}

export const QUALITY_SCORE: Record<ChoiceQuality, number> = {
  PERFECT: 15,
  GOOD: 10,
  OK: 5,
  BAD: 0
}

export const QUALITY_COINS: Record<ChoiceQuality, number> = {
  PERFECT: 6,
  GOOD: 4,
  OK: 2,
  BAD: -1
}

export function getLevelFromXp(xp: number) {
  const safeXp = Math.max(0, Number(xp) || 0)
  let level = 1
  let requiredTotal = 0

  while (true) {
    const nextLevelCost = 80 + level * 35
    if (safeXp < requiredTotal + nextLevelCost) return level

    requiredTotal += nextLevelCost
    level += 1
  }
}

export function getLevelProgress(xp: number) {
  const safeXp = Math.max(0, Number(xp) || 0)
  const level = getLevelFromXp(safeXp)
  let levelStartXp = 0

  for (let current = 1; current < level; current += 1) {
    levelStartXp += 80 + current * 35
  }

  const nextLevelXp = 80 + level * 35
  const currentLevelXp = safeXp - levelStartXp

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    ratio: Math.min(1, currentLevelXp / nextLevelXp)
  }
}

export function getRankName(level: number) {
  if (level >= 30) return "Bậc thầy sinh tồn"
  if (level >= 20) return "Chuyên gia"
  if (level >= 12) return "Người dẫn đường"
  if (level >= 7) return "Lữ khách"
  if (level >= 3) return "Tập sự"
  return "Tân binh"
}

export const CONFETTI_CONFIG: Record<ChoiceQuality, { particleCount: number; spread: number }> = {
  PERFECT: { particleCount: 100, spread: 90 },
  GOOD: { particleCount: 80, spread: 70 },
  OK: { particleCount: 40, spread: 50 },
  BAD: { particleCount: 0, spread: 0 }
}

export const GAME_CONFIG = {
  MAX_HP: 5,

  XP: {
    PERFECT: 15,
    GOOD: 10,
    OK: 5,
    BAD: 0
  },

  COINS: QUALITY_COINS,

  STAGE: {
    MIN_QUESTIONS: 6,
    MAX_QUESTIONS: 12,
    RANDOM_RANGE: 4
  },

  ENDING: {
    LOW_HP_THRESHOLD: 1,
    BAD_ACCURACY: 0.4,
    NORMAL_ACCURACY: 0.7,
    PERFECT_RATE: 0.2
  },

  QUALITY_RESULT,
  QUALITY_SCORE,
  CONFETTI: CONFETTI_CONFIG
} as const
