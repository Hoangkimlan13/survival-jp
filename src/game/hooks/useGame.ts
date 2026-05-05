"use client"

import { useEffect, useRef, useState } from "react"
import { engine } from "@/src/game/engine"
import { api } from "@/src/game/api"
import { cache } from "@/src/game/cache"
import { getProgress, setProgress } from "@/lib/progress"
import { MAX_HP, HP_RECOVERY_PER_STAGE } from "@/src/game/constants"
import { playStorySound, playEndingSound, playFinalSound } from "@/src/game/sound"

/* ================= UTILS ================= */

function unwrapQuestion(q: any) {
  return q?.type === "question" ? q.data : null
}

/* ================= HOOK ================= */

export function useGame() {
  const [progress, setProgressState] = useState<any>(null)
  const [current, setCurrent] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const [phase, setPhase] = useState<
    "idle" | "answering" | "result" | "transition"
  >("idle")

  const [event, setEvent] = useState<any>(null)
  const [xpGain, setXpGain] = useState(0)
  const [skipEffect, setSkipEffect] = useState(false)

  const nextRef = useRef<any>(null)
  const lock = useRef(false)

  const [prevStreak, setPrevStreak] = useState(0)

  /* ================= EVENT ================= */

  const saveEvent = (e: any) => {
    setEvent(e)
    // Lưu event trong progress thay vì localStorage
    const updatedProgress = { ...progress, event: e }
    setProgress(updatedProgress)
  }

  /* ================= INIT ================= */

  useEffect(() => {
    let mounted = true

    const init = async () => {
      let p = getProgress()

      if (!p || !Array.isArray(p.pool) || p.pool.length === 0) {
        const initRes = await engine.init()

        // 🧨 FIX CỐT LÕI: đảm bảo không lấy error object
        if (!initRes || (initRes as any).type === "error") {
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

      if (p.event) {
        setProgressState(p)
        setEvent(p.event)
        return
      }

      /* ===== fix stuck stage ===== */

      if (p.turn >= p.stageGoal) {
        const next = await engine.next(p)

        if ("type" in next) {
          saveEvent(next)
          return
        }

        p = next
      }

      /* ===== LOAD QUESTION AAA ===== */

      const q1 = await engine.loadQuestion(p)
      const q1Data = unwrapQuestion(q1)
      if (!q1Data) return

      // 🔥 mark used cho câu 1 để tránh trùng
      const tempProgress = {
        ...p,
        pool: Array.isArray(p.pool)
          ? p.pool.map(q =>
              q.id === q1Data.id ? { ...q, used: true } : q
            )
          : []
      }

      const q2 = await engine.loadQuestion(tempProgress)
      const q2Data = unwrapQuestion(q2)
      if (!q2Data) return

      if (!mounted) return

      setProgressState(p)
      setCurrent(q1Data)
      nextRef.current = q2Data
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  /* ================= ANSWER ================= */

  const answer = async (choice: any) => {
    if (!progress || !current) return

    setPhase("answering")

    const res = await engine.answer(progress, current, choice)

    setXpGain(res.xpGain || 0)
    setProgressState(res.updated)
    setSelected(choice)
    setPrevStreak(res.prevStreak || 0)

    setPhase("result")

    /* ===== END STAGE ===== */

    if (res.forceEnd) {
      const next = await engine.next(res.updated)

      if ("type" in next) {
        saveEvent({
          ...next,
          xpGain: res.xpGain
        })
        return
      }

      setProgressState(next)
      setCurrent(nextRef.current)
      setSelected(null)
      setPhase("idle")
      return
    }

    /* ===== PRELOAD NEXT ===== */

    if (!lock.current) {
      lock.current = true

      engine.loadQuestion(res.updated).then(q => {
        const data = unwrapQuestion(q)
        if (data) nextRef.current = data

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

  const res = await engine.skip(progress, current)

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
  setSelected(null)

  /* ===== END STAGE ===== */
  if (res.forceEnd) {
    const next = await engine.next(damaged)

    if ("type" in next) {
      saveEvent(next)
      return
    }

    setProgressState(next)
    setCurrent(nextRef.current)
    setPhase("idle")
    return
  }

  /* ===== LOAD CÂU MỚI ===== */
  const q1 = await engine.loadQuestion(damaged)
  const q1Data = unwrapQuestion(q1)
  if (!q1Data) return

  // 🔥 mark used tiếp để preload không trùng
  const tempProgress = {
    ...damaged,
    pool: damaged.pool.map(q =>
      q.id === q1Data.id ? { ...q, used: true } : q
    )
  }

  const q2 = await engine.loadQuestion(tempProgress)
  const q2Data = unwrapQuestion(q2)

  setCurrent(q1Data)
  nextRef.current = q2Data

  setPhase("idle")
}

  /* ================= NEXT ================= */

  const next = async () => {
    if (!progress) return

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
        const fresh = await engine.init(newProgress)

        const q1 = await engine.loadQuestion(fresh)
        const q1Data = unwrapQuestion(q1)
        if (!q1Data) return

        const tempProgress = {
          ...fresh,
          pool: fresh.pool.map(q =>
            q.id === q1Data.id ? { ...q, used: true } : q
          )
        }

        const q2 = await engine.loadQuestion(tempProgress)
        const q2Data = unwrapQuestion(q2)

        setProgressState(fresh)
        setCurrent(q1Data)
        nextRef.current = q2Data

        setSelected(null)
        setPhase("idle")

        setTimeout(() => setXpGain(0), 500)
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

        if (!fresh || (fresh as any).type === "error") {
          console.error("[INIT DAY FAILED]", fresh)
          return
        }

        /* ================= LOAD QUESTION ================= */

        const q1 = await engine.loadQuestion(fresh)
        const q1Data = unwrapQuestion(q1)
        if (!q1Data) return

        const tempProgress = {
          ...fresh,
          pool: fresh.pool.map(q =>
            q.id === q1Data.id ? { ...q, used: true } : q
          )
        }

        const q2 = await engine.loadQuestion(tempProgress)
        const q2Data = unwrapQuestion(q2)

        setProgressState(fresh)
        setCurrent(q1Data)
        nextRef.current = q2Data

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

    setProgressState(result)
    setCurrent(nextRef.current)

    setSelected(null)
    setPhase("idle")
  }

  useEffect(() => {
    if (!event) return

    if (event.type === "story") {
      playStorySound(event.data?.trigger)
    } else if (event.type === "ending") {
      playEndingSound(event.data?.type)
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
    xpGain,
    skipEffect,
    prevStreak
  }
}