// src/game/engine.ts

import {
  getProgress,
  setProgress,
  createDefaultProgress,
  type Progress,
  type ProgressLog 
} from "@/lib/progress"

import type { 
  Choice, 
  Scenario, 
  LoadResult, 
  ReadingItem, 
  Story, 
  Ending,
  Stage,
  EndingType 
} from "./types"

import {
  QUALITY_COINS,
  QUALITY_SCORE,
  QUALITY_RESULT,
  getLevelFromXp,
  type ChoiceQuality
} from "./config"
import { api } from "./api"
import {
  fireConfetti,
  addScreenShake,
  removeScreenShake
} from "./effects"

import { cache } from "./cache"
import { playCorrect, playWrong, playOk, playSkip } from "./sound"

import {
  MAX_HP,
  STAGE_MIN_QUESTIONS,
  STAGE_MAX_QUESTIONS
} from "./constants"


import { getStoryTrigger } from "./story"

import { analyzeEnding, getEndingType } from "./endingAI"
import { pickEnding } from "./endingPicker"
import { getEndingsCached } from "./endingCache"
import { answerHaptic } from "@/src/lib/haptic"
/* ================= CACHE ================= */


function normalizeEndingType(type: string): EndingType {
  const map: Record<string, EndingType> = {
    good: "good",
    normal: "normal",
    bad: "bad"
  }

  return map[type.toLowerCase()] ?? "normal"
}


const KANJI_RE = /[\u4e00-\u9faf]/;
const KANA_RE = /[\u3040-\u30ff]/;

export function smartSegment(text: string, reading: ReadingItem[] = []) {
  const result: ReadingItem[] = [];

  let i = 0;

  for (const item of reading) {
    const { text: block, reading: kana } = item;

    const index = text.indexOf(block, i);
    if (index === -1) continue;

    // text trước block
    if (index > i) {
      result.push({ text: text.slice(i, index) });
    }

    // 🎯 detect nếu block có kanji
    const isKanjiBlock = KANJI_RE.test(block);

    result.push({
      text: block,
      reading: isKanjiBlock ? kana : undefined
    });

    i = index + block.length;
  }

  if (i < text.length) {
    result.push({ text: text.slice(i) });
  }

  return result;
}


const readingCache = new Map<string, ReadingItem[]>()

async function parseBatch(texts: string[]) {
  const uncached = texts.filter(t => !readingCache.has(t))

  if (uncached.length > 0) {
    const res = await fetch("/api/jp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texts: uncached })
    })

    const data = res.ok
      ? await res.json() as Record<string, ReadingItem[]>
      : {}

    Object.entries(data).forEach(([text, value]) => {
      readingCache.set(text, value)
    })
  }

  const result: Record<string, ReadingItem[]> = {}

  texts.forEach(t => {
    result[t] = readingCache.get(t) || []
  })

  return result
}

/* ================= UTILS ================= */

function shuffle<T>(arr: T[] = []): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type LoadQuestionOptions = {
  excludeIds?: number[]
  disableCache?: boolean
}

/* ================= AI SYSTEM ================= */

function getDifficulty(progress: Progress) {
  if (progress.streak >= 8) return "hard"
  if (progress.streak >= 4) return "normal"
  return "easy"
}


function getRecentQuestionIds(progress: Progress, limit = 3) {
  return (progress.history ?? [])
    .slice(-limit)
    .map(h => h.questionId)
    .filter((id): id is number => typeof id === "number")
}

function markQuestionUsed(pool: Scenario[], questionId: number) {
  return pool.map(q => q.id === questionId ? { ...q, used: true } : q)
}

function isCachedQuestionValid(
  result: LoadResult,
  progress: Progress,
  excludeIds: number[]
) {
  if (result.type !== "question") return true

  const questionId = result.data.id
  const poolItem = progress.pool?.find(q => q.id === questionId)
  const lastQuestionIds = getRecentQuestionIds(progress, 1)

  return !poolItem?.used &&
    !excludeIds.includes(questionId) &&
    !lastQuestionIds.includes(questionId)
}

function pickQuestion(
  pool: Scenario[],
  progress: Progress,
  options: LoadQuestionOptions = {}
): Scenario {
  const excluded = new Set(options.excludeIds ?? [])
  const recentIds = new Set(getRecentQuestionIds(progress))
  let candidates = pool.filter(q => !q.used && !excluded.has(q.id))

  if (candidates.length > 1) {
    const notRecent = candidates.filter(q => !recentIds.has(q.id))
    if (notRecent.length) candidates = notRecent
  }

  // If the stage goal is bigger than the available questions, recycle
  // old questions but keep the immediate previous question out.
  if (candidates.length === 0) {
    candidates = pool.filter(q => !excluded.has(q.id))

    if (candidates.length > 1) {
      const notRecent = candidates.filter(q => !recentIds.has(q.id))
      if (notRecent.length) candidates = notRecent
    }
  }

  if (candidates.length === 0) {
    candidates = pool
  }

  const difficulty = getDifficulty(progress)

  const weak = candidates.filter(q =>
    progress.history?.some(h => h.questionId === q.id && h.result === "BAD")
  )

  if (weak.length && difficulty !== "easy") {
    return weak[Math.random() * weak.length | 0]
  }

  return candidates[Math.random() * candidates.length | 0]
}

/* ================= Story và ending ================= */

function weightedRandom(stories: Story[]) {
  if (!stories || stories.length === 0) return null

  const total = stories.reduce((sum, s) => {
    const weight = s.weight ?? (10 - (s.rarity || 1))
    return sum + weight
  }, 0)

  let rand = Math.random() * total

  for (const s of stories) {
    const weight = s.weight ?? (10 - (s.rarity || 1))
    rand -= weight
    if (rand <= 0) return s
  }

  return stories[0]
}

/* ================= PRELOAD ================= */

let cache1: { stageId: number; data: LoadResult } | null = null
let cache2: { stageId: number; data: LoadResult } | null = null

/* ================= ENGINE ================= */

export const engine = {

  /* ================= INIT ================= */

  async init(customProgress?: Progress): Promise<Progress> {
    let progress = customProgress ?? getProgress()

    if (!progress) {
      progress = createDefaultProgress()
    }

    if (customProgress) {
      cache.setScenarios([])
      cache.setStages([])
      cache1 = null
      cache2 = null
      readingCache.clear()
    }

    /* 🔥 FIX QUAN TRỌNG */
    if (!cache.getStages().length || customProgress) {
      const stagesRes = await api.getStages(progress.dayId)
      cache.setStages(stagesRes)
    }

    let all = cache.getScenarios()
    let stages = cache.getStages()

    if (all.length === 0 || stages.length === 0) {
      const [scenariosRes, stagesRes] = await Promise.all([
        api.getScenarioList({
        ...progress,
        force: Date.now() // 🔥 bust cache
      }),
        api.getStages(progress.dayId)
      ])

      cache.setScenarios(scenariosRes)
      cache.setStages(stagesRes)

      all = scenariosRes
      stages = stagesRes
    }

    const currentStage = stages.find(
      (s: Stage) => Number(s.id) === Number(progress.stageId)
    )

    const stageGoal =
      Math.floor(Math.random() * (STAGE_MAX_QUESTIONS - STAGE_MIN_QUESTIONS + 1)) +
      STAGE_MIN_QUESTIONS

    const currentStageId = progress.stageId

    const stagePool = Array.isArray(all)
    ? all.filter(q =>
        Number(q?.stageId) === Number(currentStageId)
      )
    : []

    if (!Array.isArray(stagePool) || stagePool.length === 0) {
      console.warn("[ENGINE] Empty stagePool", currentStageId)

      return {
        type: "error",
        message: `No questions for stage ${currentStageId}`
      } as unknown as Progress
    }

    // 🎯 NOW SAFE TO SHUFFLE
    const filtered = stagePool.filter(q => q?.stageId === currentStageId)

    if (filtered.length === 0) {
      console.warn("NO QUESTIONS FOR STAGE", currentStageId)

      return {
        type: "error",
        message: "Stage has no questions"
      } as unknown as Progress
    }

    const pool = shuffle(filtered).slice(0, stageGoal)

    const updated: Progress = {
      ...progress,
      stageId: progress.stageId,
      stageOrder: currentStage?.order ?? 1,
      stageName: currentStage?.name || "",
      turn: 1,
      pool,
      stageGoal,
      hp: MAX_HP,
      streak: 0,
      history: progress.history || []
    }

    setProgress(updated)

    queueMicrotask(() => {
      this.preload(updated)
    })

    return updated
  },

  /* ================= LOAD CORE ================= */

  async _loadFresh(
    progress: Progress,
    options: LoadQuestionOptions = {}
  ): Promise<LoadResult> {
    if (!progress?.pool || !Array.isArray(progress.pool)) {
      return {
        type: "error",
        message: "Invalid pool state"
      }
    }

    const pool = Array.isArray(progress.pool) ? progress.pool : []
    

    if (!pool.length) {
      return { type: "error", message: "No pool" }
    }

    const picked = pickQuestion(progress.pool, progress, options)
    const shuffledChoices = shuffle([...picked.choices])

    const texts = [
      picked.question,
      ...shuffledChoices.map(c => c.text)
    ]

    const readings = await parseBatch(texts)

    const reading = readings[picked.question] || []

    const choices = shuffledChoices.map(c => ({
      ...c,
      reading: readings[c.text] || []
    }))

    return {
      type: "question",
      data: {
        ...picked,
        reading,
        choices
      }
    }
  },

  /* ================= PRELOAD ================= */

  async preload(progress: Progress) {
    const stageId = progress.stageId

    try {
      const first = await this._loadFresh(progress)
      cache1 = { stageId, data: first }

      const firstQuestionId = first.type === "question" ? first.data.id : null
      const secondProgress = firstQuestionId
        ? {
            ...progress,
            pool: markQuestionUsed(progress.pool, firstQuestionId)
          }
        : progress

      const second = await this._loadFresh(secondProgress, {
        excludeIds: firstQuestionId ? [firstQuestionId] : []
      })
      cache2 = { stageId, data: second }
    } catch {
      cache1 = null
      cache2 = null
    }
  },

  /* ================= LOAD ================= */

  async loadQuestion(
    progress: Progress,
    options: LoadQuestionOptions = {}
  ): Promise<LoadResult> {
    const stageId = progress.stageId
    const excludeIds = options.excludeIds ?? []

    if (
      !options.disableCache &&
      cache1 &&
      cache1.stageId === stageId &&
      isCachedQuestionValid(cache1.data, progress, excludeIds)
    ) {
      const res = cache1.data

      cache1 = cache2
      cache2 = null

      this.preload(progress)

      // 🔥 ADD THIS
      if (res.type === "question") {
        res.data.choices = shuffle([...res.data.choices])
      }

      return res
    }

    const result = await this._loadFresh(progress, options)

    this.preload(progress)

    return result
  },

  /* ================= ANSWER ================= */

  async answer(progress: Progress, data: Scenario, choice: Choice) {
    const quality: ChoiceQuality = choice.quality ?? "OK"

    const xpGain = QUALITY_SCORE[quality]
    const coinGain = QUALITY_COINS[quality]
    const result = QUALITY_RESULT[quality] as ProgressLog["result"]

    /* EFFECT */
    if (quality === "BAD") {
      addScreenShake()
      answerHaptic("BAD")
      setTimeout(removeScreenShake, 300)
      playWrong()
    } else if (quality === "PERFECT") {
      answerHaptic("PERFECT")
      fireConfetti({ particleCount: 100, spread: 80 })
      playCorrect()
    } else if (quality === "GOOD") {
      answerHaptic("GOOD")
      playCorrect()
    } else {
      answerHaptic("OK")
      playOk()
    }

    /* 🔥 ADD Ở ĐÂY */
    const prevStreak = progress.streak

    /* HP SYSTEM */
    let hpChange = 0

    if (quality === "BAD") hpChange = -1
    else hpChange = 0.5

    if (progress.streak >= 5) hpChange += 0.5
    if (progress.streak >= 10) hpChange += 1

    if (progress.hp <= 2) hpChange -= 0.5

    const newHp = Math.max(0, Math.min(MAX_HP, progress.hp + hpChange))
    const nextXp = progress.xp + xpGain
    const nextCoins = Math.max(0, (progress.coins ?? 0) + coinGain)

    /* UPDATE POOL */
    const safePool = Array.isArray(progress.pool) ? progress.pool : []

    const newPool = safePool.map(q =>
      q.id === data.id ? { ...q, used: true } : q
    )

    const nextTurn = progress.turn + 1

    const updated: Progress = {
      ...progress,
      pool: newPool,
      xp: nextXp,
      coins: nextCoins,
      level: getLevelFromXp(nextXp),
      hp: newHp,
      streak: quality !== "BAD" ? progress.streak + 1 : 0,
      turn: nextTurn,
      history: [
        ...progress.history,
        {
          questionId: data.id,
          choiceId: choice.id,
          result,
          xpGain,
          coinGain
        }
      ]
    }

    const forceEnd = nextTurn > progress.stageGoal

    setProgress(updated)

    return {
      updated,
      xpGain,
      coinGain,
      level: getLevelFromXp(nextXp),
      leveledUp: getLevelFromXp(nextXp) > (progress.level ?? getLevelFromXp(progress.xp)),
      result,
      quality,
      forceEnd,
      prevStreak // 🔥 ADD DÒNG NÀY
    }
  },


/* ================= SKIP ================= */

async skip(progress: Progress, data: Scenario) {

  playSkip()

  const safePool = Array.isArray(progress.pool) ? progress.pool : []

  // 🔥 đánh dấu câu đã skip (không tính đúng/sai)
  const newPool = safePool.map(q =>
    q.id === data.id ? { ...q, used: true } : q
  )

  // 💀 penalty nhẹ (giống "bỏ qua trong sinh tồn")
  const hpLoss = 0.5

  const newHp = Math.max(0, progress.hp - hpLoss)

  const nextTurn = progress.turn + 1
  const coinGain = -1
  const nextCoins = Math.max(0, (progress.coins ?? 0) + coinGain)

  const updated: Progress = {
    ...progress,
    pool: newPool,
    coins: nextCoins,
    level: getLevelFromXp(progress.xp),
    hp: newHp,
    streak: 0, // skip thì break combo
    turn: nextTurn,
    history: [
      ...progress.history,
      {
        questionId: data.id,
        choiceId: "SKIP" as const,
        result: "SKIP",
        xpGain: 0,
        coinGain
      }
    ]
  }

  const forceEnd = nextTurn > progress.stageGoal

  setProgress(updated)

  return {
    updated,
    coinGain,
    forceEnd,
    trigger: "SKIP"
  }
},

  /* ================= NEXT ================= */

  async next(progress: Progress, skipStory = false) {

    const isOnlySkip =
      progress.history.length > 0 &&
      progress.history.every(h => h.choiceId === "SKIP")

    if (isOnlySkip) {
      return {
        ...progress,
        blockStory: true
      }
    }

   if (progress.turn >= progress.stageGoal) {
      return this.handleEndStage(progress)
    }
    return progress
  },

  /* ================= END ================= */

async handleEndStage(progress: Progress) {
  const stages = cache.getStages()

  const index = stages.findIndex(s => s.id === progress.stageId)
  const nextStage = stages[index + 1]

  /* ================= STORY FIRST ================= */
  if (nextStage) {
    const stories = await api.getStories(progress)
    const picked = weightedRandom(stories)

    if (picked) {
      const updated = {
        ...progress,
        usedStories: [
          ...(progress.usedStories ?? []),
          picked.id
        ]
      }

      setProgress(updated)

      return {
        type: "story",
        data: picked,
        nextStage
      }
    }
  }

  /* ================= ENDING (ONLY WHEN NO NEXT STAGE) ================= */

  const score = analyzeEnding(progress)
  const rawType = getEndingType(score)

  const type = normalizeEndingType(rawType)

  const endings = await getEndingsCached(progress.dayId, type)

  if (!endings || endings.length === 0) {
    console.warn("[NO ENDINGS FOUND]")

    return {
      type: "ending",
      data: {
        id: -1,
        type: "normal",
        title: "To be continued...",
        message: "Bạn đã sống sót qua ngày hôm nay.",
        image: null
      }
    }
  }

  const ending = pickEnding(endings, progress)

  const updated = {
    ...progress,
    usedEndings: [
      ...(progress.usedEndings ?? []),
      ending.id
    ]
  }

  setProgress(updated)

  return {
    type: "ending",
    data: ending
  }
}
  
}
