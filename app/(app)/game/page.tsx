"use client"

import { useEffect, useState, useRef, useLayoutEffect } from "react"
import { getProgress, setProgress as saveProgress } from "@/lib/progress"
import styles from "@/styles/game.module.css"
import { useRouter } from "next/navigation"
import { speak } from "@/lib/tts"

import confetti from "canvas-confetti"

/* ================= TYPES ================= */
type ChoiceQuality = "PERFECT" | "GOOD" | "OK" | "BAD"

type Choice = {
  id: number
  text: string
  translation?: string
  correct: boolean
  feedback: string
  reading?: ReadingItem[]
  quality?: ChoiceQuality  
}

type ReadingItem = {
  text: string
  reading: string
  base: string
  pos: string
}

type Scenario = {
  id: number
  question: string
  translation: string
  hint?: string
  reading?: ReadingItem[]
  choices: Choice[]
}

type AnswerLog = {
  questionId: number
  choiceId: number | null
  result: "GOOD" | "MEDIUM" | "BAD" | "SKIP"
  xpGain: number
}

type Progress = {
  dayId: number
  stageId: number
  stageName?: string
  stageGoal?: number
  turn: number
  xp: number
  hp: number
  used: number[]
  streak: number

  history?: AnswerLog[]   
}



/* ================= COMPONENT ================= */
export default function GamePage() {
  const [data, setData] = useState<Scenario | null>(null)
  const [progress, setProgressState] = useState<Progress | null>(null)
  const [selected, setSelected] = useState<Choice | null>(null)
  const [showVN, setShowVN] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endingData, setEndingData] = useState<any>(null)
  const [speakingText, setSpeakingText] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const router = useRouter()
  

  const resultRef = useRef<HTMLDivElement | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [xpAnimated, setXpAnimated] = useState(0)

  const QUALITY_SCORE: Record<ChoiceQuality, number> = {
    PERFECT: 15,
    GOOD: 10,
    OK: 5,
    BAD: 0
  }

  const QUALITY_RESULT: Record<ChoiceQuality, "GOOD" | "BAD"> = {
    PERFECT: "GOOD",
    GOOD: "GOOD",
    OK: "GOOD",
    BAD: "BAD"
  }

  const [finalConfig, setFinalConfig] = useState<any>(null)
  const FEEDBACK_TEXT = {
    GOOD: [
      "Tuyệt vời 🔥",
      "Chuẩn luôn 👍",
      "Quá đỉnh!",
      "Bạn làm tốt lắm!",
      "Chính xác!"
    ],
    MEDIUM: [
      "Ổn đó 👍",
      "Gần đúng rồi!",
      "Cũng được đó",
      "Suýt đúng rồi!",
      "Cố thêm chút nữa!"
    ],
    BAD: [
      "Sai rồi 💢",
      "Chưa đúng đâu",
      "Cẩn thận lại nhé",
      "Thử lại nào",
      "Hơi lệch rồi"
    ]
  }

  useEffect(() => {
    if (!selected) return

    const last = progress?.history?.slice(-1)[0] as AnswerLog | undefined

    const feeling =
      last?.result === "BAD"
        ? "BAD"
        : selected?.quality === "OK"
        ? "MEDIUM"
        : "GOOD"

    const getRandom = (arr: string[]) =>
      arr[Math.floor(Math.random() * arr.length)]

    const cfg =
      feeling === "GOOD"
        ? {
            title: getRandom(FEEDBACK_TEXT.GOOD),
            color: styles.good,
            emoji: "🔥"
          }
        : feeling === "MEDIUM"
        ? {
            title: getRandom(FEEDBACK_TEXT.MEDIUM),
            color: styles.medium,
            emoji: "👍"
          }
        : {
            title: getRandom(FEEDBACK_TEXT.BAD),
            color: styles.bad,
            emoji: "💢"
          }

    setFinalConfig(cfg)
  }, [selected])


  const hpRatio = Math.max(0, Math.min(1, (progress?.hp ?? 0) / 5))

  const getStatus = () => {
    (progress?.turn ?? 0) / (progress?.stageGoal ?? 8)
    if (hpRatio > 0.6) return "safe"
    if (hpRatio > 0.3) return "warning"
    return "danger"
  }

  const status = getStatus()

    const getFace = () => {
    if (hpRatio > 0.7) return "😄"
    if (hpRatio > 0.4) return "😐"
    if (hpRatio > 0.2) return "😰"
    return "💀"
  }

  const stageRatio =
  progress?.stageGoal
    ? progress.turn / progress.stageGoal
    : 0


  const generateStageGoal = (stageId: number) => {
    const base = 6 + Math.floor(stageId / 2)
    const random = Math.floor(Math.random() * 5) // 0–4
    return Math.min(base + random, 12)
  }

  useEffect(() => {
    const isDanger = hpRatio < 0.25

    if (isDanger) {
      document.body.classList.add("dangerShake")
    } else {
      document.body.classList.remove("dangerShake")
    }
  }, [hpRatio])

  /* ================= LOAD QUESTION ================= */


  const shuffleArray = (arr: any[]) => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const loadQuestion = async (p: Progress) => {
    const [qRes, stageRes] = await Promise.all([
      fetch(`/api/scenario?stageId=${p.stageId}&used=${p.used.join(",")}`),
      fetch(`/api/stages?dayId=${p.dayId}`)
    ])

    const result = await qRes.json()
    const stages = await stageRes.json()

    if (result.done) {
      await handleNext(p) 
      return
    }

    // ✅ RANDOM 1 LẦN DUY NHẤT
    const shuffledChoices = shuffleArray(result.choices)

    const currentStage = stages.find((s: any) => s.id === p.stageId)

    const updated = {
      ...p,
      stageName: currentStage?.name || "Unknown Stage",
      stageGoal: p.stageGoal ?? generateStageGoal(p.stageId)
    }

    setProgressState(updated)
    saveProgress(updated)

    // ✅ setData với choices đã random
    setData({
      ...result,
      choices: shuffledChoices
    })
  }
  

  /* ================= INIT ================= */
  useEffect(() => {
    const p = getProgress()

    if (p) {
      // ✅ dùng progress cũ
      setProgressState(p)
      loadQuestion(p)
      return
    }


    const init: Progress = {
      dayId: 1,
      stageId: 1,
      stageName: "Đang tải...",
      stageGoal: generateStageGoal(1),
      turn: 1,
      xp: 0,
      hp: 5,
      used: [],
      streak: 0
    }

    saveProgress(init)
    setProgressState(init)

    loadQuestion(init)
  }, [])

  /* ================= SPEAK ================= */
  

  const SpeakButton = ({ text }: { text: string }) => {
    const isSpeaking = speakingText === text

    const handleSpeak = async () => {
      setSpeakingText(text)

      const utter = await speak(text)

      if (utter) {
        utter.onend = () => {
          setSpeakingText(null)
        }
      } else {
        setSpeakingText(null)
      }
    }

    return (
      <button
        className={`${styles.speakerBtn} ${isSpeaking ? styles.speaking : ""}`}
        onClick={handleSpeak}
      >
        <span className="material-symbols-rounded">
          {isSpeaking ? "graphic_eq" : "volume_up"}
        </span>
      </button>
    )
  }

  /* ================= RENDER JAPANESE ================= */
  const renderJapanese = (text: string, reading?: ReadingItem[]) => {
    if (!reading?.length) return <span>{text}</span>

    const map = new Map(reading.map(r => [r.text, r]))
    const output: React.ReactNode[] = []

    let i = 0
    let buffer = ""

    const flush = () => {
      if (buffer) {
        output.push(<span key={"b" + i}>{buffer}</span>)
        buffer = ""
      }
    }

    while (i < text.length) {
      let matched = false

      for (const [key, info] of map) {
        if (text.startsWith(key, i)) {
          flush()

          const isKanji = /[\u4e00-\u9faf]/.test(key)

          output.push(
            <span key={i} className={styles.furiWrap}>
              {isKanji && (
                <span className={styles.furiTextTop}>
                  {info.reading}
                </span>
              )}
              <span>{key}</span>
            </span>
          )

          i += key.length
          matched = true
          break
        }
      }

      if (!matched) {
        buffer += text[i]
        i++
      }
    }

    flush()
    return output
  }

  /* ================= ANSWER ================= */
  const handleAnswer = (choice: Choice) => {
    if (!progress || !data) return

    setSelected(choice)

    const quality = choice.quality ?? "OK"

    const xpGain = QUALITY_SCORE[quality]
    const result = QUALITY_RESULT[quality]

    const confettiConfig: Record<ChoiceQuality, any | null> = {
      PERFECT: { particleCount: 180, spread: 100 },
      GOOD: { particleCount: 100, spread: 80 },
      OK: { particleCount: 60, spread: 60 },
      BAD: null
    }

    const config = confettiConfig[quality]

    if (config) {
      confetti(config)
    }

    setXpAnimated(0)

    let start = 0
    const duration = 500
    const stepTime = 20
    const steps = duration / stepTime
    const increment = xpGain / steps

    const interval = setInterval(() => {
      start += increment

      if (start >= xpGain) {
        start = xpGain
        clearInterval(interval)
      }

      setXpAnimated(Math.floor(start))
    }, stepTime)

    const log: AnswerLog = {
      questionId: data.id,
      choiceId: choice.id,
      result,
      xpGain
    }

    const updated = {
      ...progress,
      used: [...progress.used, data.id],
      xp: progress.xp + xpGain,
      hp: quality === "BAD" ? progress.hp - 1 : progress.hp,
      streak: quality !== "BAD" ? progress.streak + 1 : 0,
      history: [...(progress.history || []), log]
    }

    setSelected(choice)
    setSelectedId(choice.id)

    saveProgress(updated)
    setProgressState(updated)

    setShowResult(true)
  }

  useLayoutEffect(() => {
    if (!showResult) return
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    })
  }, [showResult])



  function calculateEnding(progress: Progress) {
    const history = progress.history || []

    if (!history.length) return "bad"

    const total = history.length

    const goodCount = history.filter(h => h.result === "GOOD").length
    const badCount = history.filter(h => h.result === "BAD").length

    const accuracy = goodCount / total

    const perfectCount = history.filter(h => h.xpGain >= 15).length
    const perfectRate = perfectCount / total

    // 💀 chết nhiều
    if (progress.hp <= 1 || accuracy < 0.4) return "bad"

    // 😐 trung bình
    if (accuracy < 0.7 || perfectRate < 0.2) return "normal"

    // 😎 giỏi
    return "good"
  }

  /* ================= NEXT ================= */
  const handleNext = async (p?: Progress) => {
    const current = p || progress
    if (!current) return

    const nextTurn = current.turn + 1

    // ✅ END STAGE
    if (!current.stageGoal) return

    if (nextTurn > current.stageGoal) {
      // 1️⃣ LOAD STORY
      const storyRes = await fetch(
        `/api/story?stageId=${current.stageId}&dayId=${current.dayId}`
      )

      const story = await storyRes.json()

      if (story) {
        setEndingData({ ...story, mode: "story" })
        setEnding(true)
        return
      }

      // 2️⃣ CHECK NEXT STAGE
      const stageRes = await fetch(`/api/stages?dayId=${current.dayId}`)
      const stages = await stageRes.json()

      const currentIndex = stages.findIndex((s: any) => s.id === current.stageId)
      const nextStage = stages[currentIndex + 1]

      // 👉 còn stage
      if (nextStage) {
        const next = {
          ...current,
          stageId: nextStage.id,
          turn: 1,
          used: [],
          stageGoal: generateStageGoal(nextStage.id)
        }

        saveProgress(next)
        setProgressState(next)

        await loadQuestion(next)
        return
      }

      

      // 3️⃣ HẾT STAGE → ENDING
      const type = calculateEnding(current)

      const endingRes = await fetch(
        `/api/ending?dayId=${current.dayId}&type=${type}`
      )

      const ending = await endingRes.json()

      setEndingData({ ...ending, mode: "ending" })
      setEnding(true)
      return
    }

    // 👉 normal next question
    const updated = { ...current, turn: nextTurn }

    saveProgress(updated)
    setProgressState(updated)

    setSelected(null)

    await loadQuestion(updated)
  }


  /* ================= Skip ================= */
  const handleSkip = async () => {
    if (!progress || !data) return

    const log: AnswerLog = {
      questionId: data.id,
      choiceId: null,
      result: "SKIP",
      xpGain: 0
    }

    const updated = {
      ...progress,
      used: [...progress.used, data.id],
      streak: 0,
      hp: Math.max(0, progress.hp - 1),
      history: [...(progress.history || []), log]
    }

    saveProgress(updated)
    setProgressState(updated)

    await handleNext(updated)
  }

  function getFeeling(
    result: "GOOD" | "MEDIUM" | "BAD",
    quality: ChoiceQuality
  ): "GOOD" | "MEDIUM" | "BAD" {
    if (result === "BAD") return "BAD"

    if (quality === "PERFECT") return "GOOD"
    if (quality === "GOOD") return "GOOD"

    if (quality === "OK") return "MEDIUM"
    return "MEDIUM"
  }

  /* ================= ENDING ================= */
  if (ending) {
    const isStory = endingData?.mode === "story"

    return (
      <div className={styles.endingScreen}>
        <div className={`${styles.endingCard} ${isStory ? styles.story : ""}`}>

          {/* TITLE */}
          {endingData?.title && <h1>{endingData.title}</h1>}

          {/* IMAGE */}
          {endingData?.image && (
            <div className={styles.endingImageWrap}>
              <img
                src={endingData.image}
                alt="ending"
                className={styles.endingImage}
                onError={(e) => {
                  // ❌ nếu ảnh lỗi → ẩn luôn
                  (e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}
          {/* CONTENT */}
          <p>{endingData?.content || endingData?.message}</p>

          {/* 👉 XP */}
          <div className={styles.xpInline}>
            <span className={styles.xpStar}>⭐</span>
            <span className={styles.xpText}>
              {progress?.xp ?? 0} XP
            </span>
          </div>

          {/* ACTION */}
          <div className={styles.endingActions}>

            <button
              className={styles.endingBtnPrimary}
              onClick={async () => {
                if (!progress) return

                setEnding(false)
                setEndingData(null)

                // 👉 STORY → next stage
                if (isStory) {
                  const stageRes = await fetch(`/api/stages?dayId=${progress.dayId}`)
                  const stages = await stageRes.json()

                  const currentIndex = stages.findIndex(
                    (s: any) => s.id === progress.stageId
                  )

                  const nextStage = stages[currentIndex + 1]
                  if (!nextStage) return

                  const next = {
                    ...progress,
                    stageId: nextStage.id,
                    turn: 1,
                    used: [],
                    stageGoal: generateStageGoal(nextStage.id)
                  }

                  saveProgress(next)
                  setProgressState(next)
                  await loadQuestion(next)
                  return
                }

                // 👉 ENDING → next day
                const next = {
                  ...progress,
                  dayId: progress.dayId + 1,
                  stageId: 1,
                  turn: 1,
                  used: [],
                  hp: 5
                }

                saveProgress(next)
                setProgressState(next)
                await loadQuestion(next)
              }}
            >
              {isStory ? "Tiếp tục" : "Sang ngày mới"}
            </button>

            {/* 🔥 HOME BUTTON */}
            <button
              className={styles.endingBtnSecondary}
              onClick={() => router.push("/")}
            >
              Về Home
            </button>

          </div>
        </div>
      </div>
    )
  }

  /* ================= UI ================= */

  if (!data || !progress) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader}></div>
        <p>Đang tải câu hỏi...</p>
      </div>
    )
  }

  return (
    <div className={styles.game}>
      {/* HEADER */}
      <div className={styles.topBar}>

        {/* BACK BUTTON */}
        <button
          className={styles.homeBtn}
          onClick={() => router.push("/")}
        >
          <span className="material-symbols-rounded">
            arrow_back_ios
          </span>
        </button>

        {/* STAGE */}
        <div className={styles.stageInfo}>
          <div className={styles.stageTitle}>
            Màn {progress.stageId} — {progress.stageName}
          </div>

          <div className={styles.stageSub}>
            Câu {progress.turn} / {progress.stageGoal}
          </div>
        </div>

        {/* XP */}
        <div className={styles.xp}>
          ⭐ {progress.xp}
        </div>

      </div>

      {/* HP */}
      <div className={`${styles.survivalHUD} ${styles[status]}`}>

        <div className={styles.hudTop}>

          {/* TRACK LAYER */}
          <div className={styles.hpTrack}>
            <div
              className={styles.hpFill}
              style={{ width: `${hpRatio * 100}%` }}
            />
          </div>

          {/* FACE OUTSIDE FLOW (IMPORTANT) */}
          <div
            className={`${styles.faceFloat} ${status}`}
            style={{
              left: `calc(${hpRatio * 100}% - 14px)`
            }}
          >
            {getFace()}
          </div>

        </div>

        {/* STAGE BAR */}
        <div className={styles.stageBar}>
          <div
            className={styles.stageFill}
            style={{
              width: `${((progress?.turn ?? 1) / (progress?.stageGoal ?? 8)) * 100}%`
            }}
          />
        </div>

      </div>

      {/* QUESTION */}
      <div className={styles.questionCard}>
        <div className={styles.questionRow}>
          <div className={styles.jpText}>
            {renderJapanese(data.question, data.reading)}
          </div>
          <SpeakButton text={data.question} />
        </div>
        {showVN && (
          <div className={styles.translation}>
            {data.translation}
          </div>
        )}
      </div>

      {/* CHOICES */}
      {data.choices?.map((c, index) => {
        const label = String.fromCharCode(65 + index)

        

        return (
          <div key={c.id} className={styles.choiceWrap}>
            <button
              onClick={() => handleAnswer(c)}
              disabled={!!selected}
              className={`${styles.choiceBtn} ${
                selectedId === c.id ? styles.active : ""
              } ${
                selected
                  ? c.correct
                    ? styles.correct
                    : c.id === selected.id
                    ? styles.wrong
                    : ""
                  : ""
              }`}
            >
              <span className={styles.choiceInner}>
                <span className={styles.choiceIndex}>{label}.</span>
                <span className={styles.choiceLabel}>
                {renderJapanese(c.text, c.reading)}

                {showVN && c.translation && (
                  <div className={styles.choiceTranslation}>
                    {c.translation}
                  </div>
                )}
              </span>
              </span>
            </button>

            <SpeakButton text={c.text} />
          </div>
        )
      })}


      

      {/* RESULT */}
      {selected && (() => {
        const last = progress?.history?.slice(-1)[0] as AnswerLog | undefined

        const feeling =
        last?.result === "BAD"
          ? "BAD"
          : selected?.quality === "OK"
          ? "MEDIUM"
          : "GOOD"


        const getRandom = (arr: string[]) =>
          arr[Math.floor(Math.random() * arr.length)]

        const config = (() => {
          switch (feeling) {
            case "GOOD":
              return {
                title: getRandom(FEEDBACK_TEXT.GOOD),
                color: styles.good,
                emoji: "🔥"
              }

            case "MEDIUM":
              return {
                title: getRandom(FEEDBACK_TEXT.MEDIUM),
                color: styles.medium,
                emoji: "👍"
              }

            case "BAD":
              return {
                title: getRandom(FEEDBACK_TEXT.BAD),
                color: styles.bad,
                emoji: "💢"
              }

            default:
              return {
                title: "Bỏ qua",
                color: styles.skip,
                emoji: "⏭"
              }
          }
        })()

        return (
          <div ref={resultRef} className={styles.resultBox}>

            {/* HEADER RESULT */}
            <div className={config.color}>
              <div className={styles.resultTitle}>
                {config.emoji} {config.title}
              </div>
            </div>

            {/* FEEDBACK từ DB */}
            <div className={styles.feedback}>
              {selected.feedback}
            </div>

            {/* XP GAIN */}
            <div className={styles.xpGain}>
              ⭐ {xpAnimated}
            </div>

            {/* NEXT */}
            <button
              className={styles.nextBtn}
              onClick={() => handleNext()}
            >
              Tiếp tục
            </button>

          </div>
        )
      })()}


      {/* ACTION BUTTONS */}
      {!selected && (
        <div className={styles.bottomActions}>

          {/* DỊCH */}
          <button
            className={styles.actionBtn}
            onClick={() => setShowVN(prev => !prev)}
          >
            <span className="material-symbols-rounded">
              {showVN ? "visibility_off" : "translate"}
            </span>
            <span>
              {showVN ? "Ẩn dịch" : "Dịch"}
            </span>
          </button>

          {/* BỎ QUA */}
          <button
            className={styles.skipBtn}
            onClick={() => handleSkip()}
          >
            <span className="material-symbols-rounded">skip_next</span>
            <span>Bỏ qua</span>
          </button>

        </div>
      )}
    </div>
  )
}
