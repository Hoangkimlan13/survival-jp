"use client"

import styles from "./GameScreen.module.css"
import { renderJapanese } from "@/src/lib/renderJapanese"
import SpeakButton from "@/src/components/SpeakButton"
import { useEffect, useRef, useState } from "react"
import { api } from "@/src/game/api"
import { getSmartMessage } from "@/src/game/utils"
import { preloadAudioContext } from "@/src/game/sound"

/* ================= COMPONENT ================= */

export default function GameScreen({
  progress,
  current,
  selected,
  onAnswer,
  onNext,
  onSkip,       
  skipEffect,
  isLocked,
  canAnswer,
  phase,
  showTranslate,
  setShowTranslate,
  event,
  xpGain,
  prevStreak,
}: any) {

  /* ================= GUARD ================= */

  const [dayMeta, setDayMeta] = useState<{ id: number; name: string; order: number } | null>(null)

  const safeCurrent = current ?? null
  const safeChoices = safeCurrent?.choices ?? []

  /* ================= PRELOAD AUDIO ================= */

  useEffect(() => {
    preloadAudioContext()
  }, [])

  /* ================= HP EFFECT ================= */

  const [isHit, setIsHit] = useState(false)

  useEffect(() => {
    if (!selected) return

    if (selected.quality === "BAD") {
      setIsHit(true)
      const t = setTimeout(() => setIsHit(false), 300)
      return () => clearTimeout(t)
    }
  }, [selected])

  const currentTurn = Math.min(
    progress?.turn ?? 1,
    progress?.stageGoal ?? 1
  )

  /* ================= XP ANIMATION ================= */

  const [xpAnimated, setXpAnimated] = useState(0)
  const xpRef = useRef<any>(null)

  useEffect(() => {
    if (xpRef.current) clearInterval(xpRef.current)

    if (!xpGain) {
      setXpAnimated(0)
      return
    }

    let value = 0
    const step = Math.max(1, Math.ceil(xpGain / 20))

    xpRef.current = setInterval(() => {
      value += step

      if (value >= xpGain) {
        value = xpGain
        clearInterval(xpRef.current)
      }

      setXpAnimated(value)
    }, 16)

    return () => clearInterval(xpRef.current)
  }, [xpGain])

  /* ================= AUTO SCROLL ================= */

  const selectedRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!selectedRef.current) return

    selectedRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center"
    })
  }, [selected])

  useEffect(() => {
    let active = true
    if (!progress?.dayId) {
      setDayMeta(null)
      return
    }

    api.getDay(progress.dayId)
      .then(day => {
        if (!active) return
        setDayMeta(day ?? null)
      })
      .catch(() => {
        if (!active) return
        setDayMeta(null)
      })

    return () => {
      active = false
    }
  }, [progress?.dayId])

  /* ================= RESET TRANSLATE ================= */

  useEffect(() => {
    setShowTranslate?.(false)
  }, [safeCurrent])

  /* ================= EVENT ================= */

  if (event?.type === "story") {
    return (
      <div className={styles.endingScreen}>
        <div className={styles.endingCard}>
          <h1>{event.data?.title || "Story"}</h1>

          {event.data?.image && (
            <div className={styles.endingImageWrap}>
              <img src={event.data.image} />
            </div>
          )}

          <p>{event.data?.content}</p>

          <div className={styles.xpGain}>
            ⭐ +{progress?.xp ?? 0} XP
          </div>

          <div className={styles.endingActions}>
            <button className={styles.nextBtn} onClick={onNext}>
              Tiếp tục
            </button>

            <button
              className={styles.homeBtnSecondary}
              onClick={() => window.location.href = "/"}
            >
              Về Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (event?.type === "ending") {
    return (
      <div className={styles.endingScreen}>
        <div className={styles.endingCard}>

          {/* TITLE */}
          <h1 className={styles.endingTitle}>
            {event.data?.title || "Ending"}
          </h1>

          {/* IMAGE */}
          {event.data?.image && (
            <div className={styles.endingImageWrap}>
              <img src={event.data.image} alt="ending" />
            </div>
          )}

          {/* MESSAGE */}
          <p className={styles.endingMessage}>
            {event.data?.message}
          </p>

          {/* TYPE BADGE */}
          <div className={styles.endingType}>
            {event.data?.type === "GOOD" && "✨ Good Ending"}
            {event.data?.type === "NORMAL" && "⚖ Normal Ending"}
            {event.data?.type === "BAD" && "💀 Bad Ending"}
          </div>

          {/* ACTIONS */}
          <div className={styles.endingActions}>
            <button
              className={styles.nextBtn}
              onClick={onNext}
            >
              Sang ngày tiếp theo
            </button>

            <button
              className={styles.homeBtnSecondary}
              onClick={() => window.location.href = "/"}
            >
              Về Home
            </button>
          </div>

        </div>
      </div>
    )
  }

  if (event?.type === "final") {
    return (
      <div className={`${styles.endingScreen} ${styles.final}`}> 
        <div className={styles.fireworks}>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className={styles.endingCard}>
          <h1 className={styles.endingTitle}>
            {event.data?.title || "Hành trình hoàn tất"}
          </h1>

          {event.data?.image && (
            <div className={styles.endingImageWrap}>
              <img src={event.data.image} alt="final" />
            </div>
          )}

          <p className={styles.endingMessage}>
            {event.data?.message || "Bạn đã hoàn thành mọi thử thách và sống sót qua cuộc sống Nhật Bản khắc nghiệt!"}
          </p>

          <div className={styles.endingActions}>
            <button
              className={styles.nextBtn}
              onClick={() => window.location.href = "/"}
            >
              Về Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ================= LOADING ================= */

 if (!progress || !safeCurrent) {
  return (
    <div className={styles.loadingWrapper}>
      <div className={styles.loadingCard}>
        <div className={styles.spinner} />
        <div className={styles.loadingText}>Đang tải câu hỏi...</div>
        <div className={styles.loadingSub}>
          Chuẩn bị thử thách tiếp theo...
        </div>
      </div>
    </div>
  )
}

  /* ================= HP ================= */

  const MAX_HP = 5
  const hp = progress.hp ?? MAX_HP
  const hpRatio = hp / MAX_HP
 
  const status =
    hp <= 1 ? `${styles.danger} ${styles.lowHP}` :
    hp <= 2 ? styles.warning :
    styles.normal

  const getFace = () => {
    if (hp <= 0) return "💀"
    if (hp === 1) return "😵"
    if (hp === 2) return "😰"

    if (progress.streak >= 6) return "🔥"
    if (progress.streak >= 4) return "😎"
    if (hp === MAX_HP) return "😄"

    return "🙂"
  }

  /* ================= RENDER ================= */

  return (
    <div className={`${styles.game} ${isLocked ? styles.locked : ""}`}>

      {/* HEADER */}
      <div className={styles.topBar}>

        <button
          className={styles.homeBtn}
          onClick={() => window.location.href = "/"}
        >
          <span className="material-symbols-rounded">
            arrow_back_ios
          </span>
        </button>

        <div className={styles.stageInfo}>
          <div className={styles.dayLabel}>
            Ngày {dayMeta?.order ?? progress.dayId}
            {dayMeta?.name ? ` • ${dayMeta.name}` : ""}
          </div>

          <div className={styles.stageTitle}>
            Màn {progress.stageOrder ?? progress.stageId}
            {progress.stageName ? ` — ${progress.stageName}` : ""}
          </div>

          <div className={styles.stageSub}>
            Câu {currentTurn} / {progress.stageGoal}
          </div>
        </div>

        <div className={styles.xp}>
          <span className={styles.xpBadge}>⭐ {progress.xp}</span>
        </div>

      </div>

      {/* HP */}
      <div className={`${styles.survivalHUD} ${status}`}>
        <div className={styles.hudTop}>

          <div className={`${styles.hpTrack} ${isHit || skipEffect ? styles.damageFlash : ""}`}>
            <div
              className={styles.hpFill}
              style={{ width: `${hpRatio * 100}%` }}
            />
          </div>

          <div
            className={`${styles.faceFloat} ${status}`}
            style={{ left: `calc(${hpRatio * 100}% - 14px)` }}
          >
            {getFace()}
          </div>
        </div>

        <div className={styles.stageBar}>
          <div
            className={styles.stageFill}
            style={{
              width: `${((progress.turn ?? 1) / (progress.stageGoal ?? 8)) * 100}%`
            }}
          />
        </div>
      </div>

      {/* QUESTION */}
      <div className={styles.questionCard}>
        <div className={styles.topRow}>
          <div className={styles.jpText}>
            {renderJapanese(safeCurrent.question, safeCurrent.reading)}
          </div>

          <SpeakButton text={safeCurrent.question} variant="inline" />
        </div>

        {showTranslate && safeCurrent.translation && (
          <div className={styles.translation}>
            {safeCurrent.translation}
          </div>
        )}
      </div>

      {/* CHOICES */}
      <div className={styles.choiceGrid}>
        {safeChoices.map((c: any, index: number) => {
          const isSelected = selected?.id === c.id

          return (
            <div key={c.id} className={styles.choiceWrap}>

              <button
                ref={isSelected ? selectedRef : null}
                disabled={!canAnswer || isLocked}
                onClick={() => onAnswer(c)}
                className={`
                  ${styles.choiceBtn}
                  ${isSelected ? styles.active : ""}
                  ${
                    selected
                      ? isSelected
                        ? styles[`quality_${selected.quality?.toLowerCase()}`]
                        : c.correct
                          ? styles.correctAnswer
                          : ""
                      : ""
                  }
                `}
              >
                <div className={styles.choiceInner}>

                  <div className={styles.choiceIndex}>
                    {String.fromCharCode(65 + index)}
                  </div>

                  <div className={styles.choiceLabel}>
                    <span className={styles.mainText}>
                      {renderJapanese(c.text, c.reading)}
                    </span>

                    {showTranslate && c.translation && (
                      <div className={styles.choiceTranslation}>
                        {c.translation}
                      </div>
                    )}
                  </div>

                </div>
              </button>

              <SpeakButton text={c.text} variant="small" />

            </div>
          )
        })}
      </div>

      {/* BOTTOM */}
      {phase === "idle" && (
        <>
          {/* TRANSLATE */}
          <button
            className={`${styles.fab} ${styles.translateFab} ${showTranslate ? styles.active : ""}`}
            onClick={() => setShowTranslate?.((v: boolean) => !v)}
            data-label={showTranslate ? "Ẩn dịch" : "Dịch"}
          >
            <span className="material-symbols-rounded">
              {showTranslate ? "visibility_off" : "translate"}
            </span>
          </button>

          {/* SKIP */}
          <button
            className={`${styles.fab} ${styles.skipFab}`}
            onClick={onSkip}
            data-label="Bỏ qua"
          >
            <span className="material-symbols-rounded">
              fast_forward
            </span>
          </button>
        </>
      )}

      {/* RESULT */}
      {phase === "result" && selected && (
        <div className={styles.resultWrapper}>
          <div className={styles.resultBox}>

            <div
              className={`
                ${styles.resultHeader}
                ${
                  selected.quality === "PERFECT"
                    ? styles.perfect
                    : selected.quality === "GOOD"
                    ? styles.good
                    : selected.quality === "BAD"
                    ? styles.bad
                    : ""
                }
              `}
            >
              {getSmartMessage(
                selected.quality,
                progress.streak,
                prevStreak, 
                progress.turn 
              )}
            </div>

            <div
              className={`
                ${styles.feedback}
                ${
                  selected.quality === "PERFECT"
                    ? styles.feedbackPerfect
                    : selected.quality === "GOOD"
                    ? styles.feedbackGood
                    : selected.quality === "BAD"
                    ? styles.feedbackBad
                    : ""
                }
              `}
            >
              {selected.feedback}
            </div>

            <div className={styles.xpGain}>
              ⭐ +{xpAnimated}
            </div>

            <button
              className={styles.nextBtn}
              onClick={onNext}
            >
              Tiếp tục
            </button>

          </div>
        </div>
      )}

    </div>
  )
}