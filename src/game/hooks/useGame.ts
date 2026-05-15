"use client"

import { useEffect, useRef, useState } from "react"
import { engine } from "@/src/game/engine"
import { api } from "@/src/game/api"
import { cache } from "@/src/game/cache"
import { getProgress, setProgress, type Progress } from "@/lib/progress"
import { MAX_HP, HP_RECOVERY_PER_STAGE } from "@/src/game/constants"
import { playStorySound, playEndingSound, playFinalSound } from "@/src/game/sound"
import type { Choice, LoadResult, Scenario, Stage } from "@/src/game/types"

type DayWithStages = {
  id: number
  stages?: Stage[]
}

/* ================= UTILS ================= */

function unwrapQuestion(q: LoadResult): Scenario | null {
  return q?.type === "question" ? q.data : null
}

function markUsed(pool: Scenario[] = [], questionId: number) {
  return pool.map(q => q.id === questionId ? { ...q, used: true } : q)
}

type GameEvent = {
  type: string
  data?: Record<string, unknown>
  nextStage?: Stage
  xpGain?: number
  [key: string]: unknown
}

function isErrorResult(value: unknown): value is { type: "error"; message: string } {
  return Boolean(
    value &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "error"
  )
}

/* ================= HOOK ================= */

type UseGameOptions = {
  mode?: "play" | "replay"
  replayStageId?: number | null
}

export function useGame(options: UseGameOptions = {}) {
  const isReplay = options.mode === "replay" && Boolean(options.replayStageId)
  const [progress, setProgressState] = useState<Progress | null>(null)
  const [current, setCurrent] = useState<Scenario | null>(null)
  const [selected, setSelected] = useState<Choice | null>(null)
  const [phase, setPhase] = useState<
    "idle" | "answering" | "result" | "transition"
  >("idle")

  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)
  const [event, setEvent] = useState<GameEvent | null>(null)
  const [xpGain, setXpGain] = useState(0)
  const [coinGain, setCoinGain] = useState(0)
  const [leveledUp, setLeveledUp] = useState(false)
  const [skipEffect, setSkipEffect] = useState(false)

  const nextRef = useRef<Scenario | null>(null)
  const preloadRef = useRef<Scenario | null>(null)
  const lock = useRef(false)

  const [prevStreak, setPrevStreak] = useState(0)

  const finishReplay = () => {
    cache.clearScenarios()
    cache.clearStages()
    setEvent({
      type: "replayComplete",
      data: {
        title: "Luyện tập hoàn tất",
        message: "Bạn đã ôn lại màn này. Ôn lại để luyện tập, không cộng XP, tiền hoặc level."
      }
    })
  }

  const loadQuestionPair = async (p: Progress, excludeIds: number[] = []) => {
    const q1 = await engine.loadQuestion(p, {
      excludeIds,
      disableCache: excludeIds.length > 0
    })
    const q1Data = unwrapQuestion(q1)
    if (!q1Data) return null

    const tempProgress = {
      ...p,
      pool: markUsed(p.pool, q1Data.id)
    }

    const q2 = await engine.loadQuestion(tempProgress, {
      excludeIds: [...excludeIds, q1Data.id],
      disableCache: true
    })
    const q2Data = unwrapQuestion(q2)

    return { current: q1Data, next: q2Data }
  }

  /* ================= EVENT ================= */

  const saveEvent = (e: GameEvent) => {
    setEvent(e)
    // Lưu event trong progress thay vì localStorage
    if (progress) {
      setProgress({ ...progress, event: e })
    }
  }

  /* ================= INIT ================= */

  useEffect(() => {
    let mounted = true

    const init = async () => {
      let p = getProgress()

      if (isReplay && options.replayStageId) {
        const days = await api.getAllDaysWithStages()
        const day = Array.isArray(days)
          ? (days as DayWithStages[]).find((item) =>
              item.stages?.some((stage: Stage) => Number(stage.id) === Number(options.replayStageId))
            )
          : null
        const stage = day?.stages?.find((item: Stage) =>
          Number(item.id) === Number(options.replayStageId)
        )

        if (!day || !stage) {
          console.error("[REPLAY INIT FAILED] Stage not found", options.replayStageId)
          return
        }

        p = {
          ...p,
          dayId: day.id,
          stageId: stage.id,
          stageOrder: stage.order,
          stageName: stage.name,
          turn: 1,
          hp: MAX_HP,
          streak: 0,
          history: [],
          pool: [],
          stageGoal: 0,
          event: null
        }

        const initRes = await engine.init(p, { persist: false })

        if (!initRes || isErrorResult(initRes)) {
          console.error("[REPLAY INIT FAILED]", initRes)
          return
        }

        p = initRes
      }

      if (!isReplay && (!p || !Array.isArray(p.pool) || p.pool.length === 0)) {
        const initRes = await engine.init()

        // 🧨 FIX CỐT LÕI: đảm bảo không lấy error object
        if (!initRes || isErrorResult(initRes)) {
          console.error("[INIT FAILED]", initRes)
          return
        }

        p = initRes
      }

      // 🔥 FIX: Luôn load stages nếu cache rỗng
      if (!cache.getStages().length) {
        const stagesRes = await api.getStages(p.dayId)
        cache.setStages(stagesRes)
      }

      /* ===== restore event ===== */

      if (!isReplay && p.event) {
        setProgressState(p)
        setEvent(p.event)
        return
      }

      /* ===== fix stuck stage ===== */

      if (!isReplay && p.turn >= p.stageGoal) {
        const next = await engine.next(p)

        if ("type" in next) {
          saveEvent(next)
          return
        }

        p = next
      }

      /* ===== LOAD QUESTION PAIR ===== */

      const pair = await loadQuestionPair(p)
      if (!pair) return

      if (!mounted) return

      setProgressState(p)
      setCurrent(pair.current)
      nextRef.current = pair.next
      preloadRef.current = null
    }

    init()

    return () => {
      mounted = false
      if (isReplay) {
        cache.clearScenarios()
        cache.clearStages()
      }
    }
  }, [isReplay, options.replayStageId])

  /* ================= ANSWER ================= */

  const answer = async (choice: Choice) => {
    if (!progress || !current) return

    setPhase("answering")

    const res = await engine.answer(progress, current, choice, {
      persist: !isReplay,
      rewards: !isReplay
    })

    setXpGain(res.xpGain || 0)
    setCoinGain(res.coinGain || 0)
    setLeveledUp(Boolean(res.leveledUp))
    setProgressState(res.updated)
    setSelected(choice)
    setPrevStreak(res.prevStreak || 0)

    setPhase("result")

    /* ===== END STAGE ===== */

    if (res.forceEnd) {
      if (isReplay) {
        finishReplay()
        return
      }

      const next = await engine.next(res.updated)

      if ("type" in next) {
        saveEvent({
          ...next,
          xpGain: res.xpGain
        })
        return
      }

      const pair = await loadQuestionPair(next, current?.id ? [current.id] : [])
      if (!pair) return

      setProgressState(next)
      setCurrent(pair.current)
      nextRef.current = pair.next
      preloadRef.current = null
      setSelected(null)
      setPhase("idle")
      return
    }

    /* ===== PRELOAD NEXT ===== */

    if (!lock.current) {
      lock.current = true

      engine.loadQuestion(res.updated, {
        excludeIds: [
          current.id,
          ...(nextRef.current?.id ? [nextRef.current.id] : [])
        ],
        disableCache: true
      })
        .then(q => {
          const data = unwrapQuestion(q)
          if (data) preloadRef.current = data
        })
        .catch(console.error)
        .finally(() => {
          lock.current = false
        })
    }
  }

/* ================= SKIP ================= */
const skip = async () => {
  if (!progress || !current) return

  setPhase("transition")

  // effect
  setSkipEffect(true)
  setTimeout(() => setSkipEffect(false), 300)

  const res = await engine.skip(progress, current, {
    persist: !isReplay,
    rewards: !isReplay
  })
  const skipCoinGain = res.coinGain || 0

  // 🔥 mark câu hiện tại là used (CỰC QUAN TRỌNG)
  const updatedProgress = {
    ...res.updated,
    pool: Array.isArray(res.updated.pool)
      ? res.updated.pool.map(q =>
          q.id === current.id ? { ...q, used: true } : q
        )
      : []
  }

  // 🔥 trừ máu
  const damaged = {
    ...updatedProgress,
    hp: Math.max(0, (updatedProgress.hp ?? 5) - 1)
  }

  setProgressState(damaged)
  if (!isReplay) {
    setProgress(damaged)
  }
  setXpGain(0)
  setCoinGain(skipCoinGain)
  setLeveledUp(false)
  setSelected(null)

  /* ===== END STAGE ===== */
  if (res.forceEnd) {
    if (isReplay) {
      finishReplay()
      return
    }

    const next = await engine.next(damaged)

    if ("type" in next) {
      saveEvent(next)
      return
    }

    const pair = await loadQuestionPair(next, [current.id])
    if (!pair) return

    setProgressState(next)
    setCurrent(pair.current)
    nextRef.current = pair.next
    preloadRef.current = null
    setPhase("idle")
    return
  }

  /* ===== LOAD CÂU MỚI ===== */
  const pair = await loadQuestionPair(damaged, [current.id])
  if (!pair) return

  setCurrent(pair.current)
  nextRef.current = pair.next
  preloadRef.current = null

  setPhase("idle")
}



/* ================= USE COIN (DỊCH/SKIP) ================= */
const useCoin = (amount: number) => {
  if (!progress) return false;

  // Kiểm tra số dư
  if ((progress.coins ?? 0) < amount) return false;

  // Cập nhật progress mới
  const updatedProgress = {
    ...progress,
    coins: (progress.coins ?? 0) - amount
  };

  // Cập nhật State để UI nhảy số ngay
  setProgressState(updatedProgress);

  // Lưu vào database/localStorage nếu không phải chế độ chơi lại
  if (!isReplay) {
    setProgress(updatedProgress);
  }

  return true;
};


  /* ================= NEXT ================= */

  const next = async () => {
    if (!progress) return

    if (event?.type === "replayComplete") {
      cache.clearScenarios()
      cache.clearStages()
      window.location.href = "/profile"
      return
    }

    if (isReplay) {
      setPhase("transition")

      const upcoming = nextRef.current

      if (!upcoming || upcoming.id === current?.id) {
        if (progress.turn > progress.stageGoal) {
          finishReplay()
          return
        }

        const pair = await loadQuestionPair(progress, current?.id ? [current.id] : [])
        if (!pair) {
          finishReplay()
          return
        }

        setProgressState(progress)
        setCurrent(pair.current)
        nextRef.current = pair.next
        preloadRef.current = null
      } else {
        setProgressState(progress)
        setCurrent(upcoming)
        nextRef.current = preloadRef.current
        preloadRef.current = null
      }

      setSelected(null)
      setPhase("idle")
      return
    }

    /* ===== HANDLE EVENT ===== */

    if (event) {
      /* ===== STORY ===== */

      if (event.type === "story") {
        const nextStage = event.nextStage
        if (!nextStage) return

        const newProgress = {
          ...progress,
          stageId: nextStage.id,
          stageOrder: nextStage.order,
          stageName: nextStage.name,
          turn: 1,
          pool: [],
          stageGoal: 0,

          hp: Math.min(
            MAX_HP,
            (progress.hp ?? MAX_HP) + HP_RECOVERY_PER_STAGE
          ),

          streak: progress.streak,
          event: null // Xóa event
        }

        setProgress(newProgress)
        setProgressState(newProgress)

        setEvent(null)
        localStorage.removeItem("game_event")

        // ✅ FIX QUAN TRỌNG
        setIsLoadingQuestion(true)
        
        const fresh = await engine.init(newProgress)

        const pair = await loadQuestionPair(fresh)
        if (!pair) return

        setProgressState(fresh)
        setCurrent(pair.current)
        nextRef.current = pair.next
        preloadRef.current = null

        setSelected(null)
        setPhase("idle")

        setIsLoadingQuestion(false)
        setTimeout(() => setXpGain(0), 500)
        setTimeout(() => setCoinGain(0), 500)
        setLeveledUp(false)
        return
      }

      /* ===== ENDING ===== */

      if (event.type === "ending") {
        const nextDayId = progress.dayId + 1
        let nextDay = null

        try {
          nextDay = await api.getDay(nextDayId)
        } catch (error) {
          console.error("[CHECK NEXT DAY FAILED]", error)
        }

        if (!nextDay) {
          setEvent({
            type: "final",
            data: {
              title: "Hành trình sinh tồn Nhật Bản hoàn tất!",
              message:
                "Bạn đã chinh phục toàn bộ ngày, toàn bộ Màn chơi rồi — từ ga tàu chật ních đến bảng kanji không lỗi. " +
                "Giờ đây bạn không chỉ sống sót, mà còn đủ bản lĩnh để tự hào: một hành trình kỷ luật, hài hước và đầy bản sắc.",
              image: null
            }
          })
          return
        }

        const stageList = await api.getStages(nextDayId)
        const firstStage = Array.isArray(stageList) ? stageList[0] : null

        if (!firstStage) {
          console.error("[INIT DAY FAILED] No stages found for day", nextDayId)
          return
        }

        const newProgress = {
          ...progress,
          dayId: nextDayId,
          stageId: firstStage.id,
          stageOrder: firstStage.order,
          stageName: firstStage.name,
          turn: 1,
          pool: [],
          stageGoal: 0,
          hp: MAX_HP,
          streak: 0,
          event: null // Xóa event
        }

        setProgress(newProgress)
        setProgressState(newProgress)

        setEvent(null)
        localStorage.removeItem("game_event")

        /* ================= INIT LẠI GAME ================= */

        const fresh = await engine.init(newProgress)

        if (!fresh || isErrorResult(fresh)) {
          console.error("[INIT DAY FAILED]", fresh)
          return
        }

        /* ================= LOAD QUESTION ================= */

        const pair = await loadQuestionPair(fresh)
        if (!pair) return

        setProgressState(fresh)
        setCurrent(pair.current)
        nextRef.current = pair.next
        preloadRef.current = null

        setSelected(null)
        setPhase("idle")

        return
      }
    }

    /* ===== NORMAL FLOW ===== */

    setPhase("transition")

    const result = await engine.next(progress)

    if ("type" in result) {
      saveEvent(result)
      return
    }

    const upcoming = nextRef.current

    if (!upcoming || upcoming.id === current?.id) {
      const pair = await loadQuestionPair(result, current?.id ? [current.id] : [])
      if (!pair) return

      setProgressState(result)
      setCurrent(pair.current)
      nextRef.current = pair.next
      preloadRef.current = null
    } else {
      setProgressState(result)
      setCurrent(upcoming)
      nextRef.current = preloadRef.current
      preloadRef.current = null
    }

    setSelected(null)
    setPhase("idle")
  }

  useEffect(() => {
    if (!event) return

    if (event.type === "story") {
      const trigger = event.data?.trigger
      playStorySound(typeof trigger === "string" ? trigger : undefined)
    } else if (event.type === "ending") {
      const type = event.data?.type
      playEndingSound(typeof type === "string" ? type : "normal")
    } else if (event.type === "final") {
      playFinalSound()
    }
  }, [event])

  /* ================= RETURN ================= */

  return {
    progress,
    current,
    selected,
    phase,
    event,
    answer,
    next,
    skip,
    useCoin,
    xpGain,
    coinGain,
    leveledUp,
    skipEffect,
    prevStreak,
    isReplay,
    isLoadingQuestion,
  }
}
