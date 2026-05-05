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