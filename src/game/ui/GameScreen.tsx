"use client"

import styles from "./GameScreen.module.css"
import { renderJapanese } from "@/src/lib/renderJapanese"
import SpeakButton from "@/src/components/SpeakButton"
import { useEffect, useRef, useState } from "react"
import { api } from "@/src/game/api"
import { getSmartMessage } from "@/src/game/utils"
import { preloadAudioContext, unlockAudioContext } from "@/src/game/sound"
import { getLevelProgress, getRankName } from "@/src/game/config"

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
  coinGain = 0,
  leveledUp = false,
  isReplay = false,
  prevStreak,
  isLoadingQuestion,
}: any) {

  
  const [days, setDays] = useState<any[]>([])

  useEffect(() => {
    api.getAllDaysWithStages().then((data: any[]) => {
      const cleaned = data
        .filter(d => d.isPublished)
        .map(d => ({
          ...d,
          stages: d.stages?.filter((s: any) => s.isPublished) ?? []
        }))

      setDays(cleaned)
    })
  }, [])

  /* ================= GUARD ================= */

  const [dayMeta, setDayMeta] = useState<{
    id: number
    name: string
    order: number
    stages?: { id: number }[]
  } | null>(null)

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

  const levelInfo = getLevelProgress(progress?.xp ?? 0)
  const rankName = getRankName(progress?.level ?? levelInfo.level)

 /* ================= REWARD ANIMATION ================= */

  const [xpAnimated, setXpAnimated] = useState(0)
  const [coinAnimated, setCoinAnimated] = useState(0)

  function easeOutExpo(t: number) {
    return t === 1
      ? 1
      : 1 - Math.pow(2, -10 * t)
  }

  useEffect(() => {
    if (phase !== "result") return

    let xpFrame = 0
    let coinFrame = 0

    const xpDuration = 650
    const coinDuration = 950

    const xpStart = performance.now()

    const xpTarget = xpGain || 0
    const coinTarget = coinGain || 0

    function easeOutExpo(t: number) {
      return t === 1
        ? 1
        : 1 - Math.pow(2, -10 * t)
    }

    /* ===== RESET ===== */

    setXpAnimated(0)
    setCoinAnimated(0)

    /* ===== XP ===== */

    const animateXp = (now: number) => {
      const elapsed = now - xpStart

      const progress = Math.min(
        elapsed / xpDuration,
        1
      )

      const eased = easeOutExpo(progress)

      setXpAnimated(
        Math.round(xpTarget * eased)
      )

      if (progress < 1) {
        xpFrame = requestAnimationFrame(animateXp)
      }
    }

    /* ===== COIN ===== */

    const coinDelay = 140

    const animateCoin = (now: number) => {
      const elapsed = now - xpStart - coinDelay

      if (elapsed < 0) {
        coinFrame = requestAnimationFrame(animateCoin)
        return
      }

      const progress = Math.min(
        elapsed / coinDuration,
        1
      )

      const eased = easeOutExpo(progress)

      setCoinAnimated(
        Math.round(coinTarget * eased)
      )

      if (progress < 1) {
        coinFrame = requestAnimationFrame(animateCoin)
      }
    }

    xpFrame = requestAnimationFrame(animateXp)
    coinFrame = requestAnimationFrame(animateCoin)

    return () => {
      cancelAnimationFrame(xpFrame)
      cancelAnimationFrame(coinFrame)
    }
  }, [phase, currentTurn])


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

  if (event?.type === "replayComplete") {
    return (
      <div className={styles.endingScreen}>
        <div className={styles.endingCard}>
          <div className={styles.practiceBadge}>Ôn lại</div>

          <h1 className={styles.endingTitle}>
            {event.data?.title || "Luyện tập hoàn tất"}
          </h1>

          <p className={styles.endingMessage}>
            {event.data?.message || "Bạn đã ôn lại màn này. Ôn tập lại không cộng XP, tiền hoặc level."}
          </p>

          <div className={styles.practiceNote}>
            Không cộng XP · Không cộng tiền · Không đổi tiến trình chính
          </div>

          <div className={styles.endingActions}>
            <button className={styles.nextBtn} onClick={onNext}>
              Về hồ sơ
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ================= LOADING ================= */

if (!progress || !safeCurrent || isLoadingQuestion){
  return (
    <div className={styles.loadingWrapper}>
      <div className={styles.loadingCard}>
        <div className={styles.spinner} />
        <div className={styles.loadingText}>Đang tải câu hỏi...</div>
        <div className={styles.loadingSub}>
          Vui lòng chờ trong giây lát
        </div>
      </div>
    </div>
  )
}

  /* ================= HP ================= */

  /* ================= HP LOGIC ================= */
  const MAX_HP = 5;
  const hp = progress.hp ?? MAX_HP;
  const hpRatio = hp / MAX_HP;

  // Trạng thái nguy kịch (dưới 25% hoặc còn 1 máu)
  const isCritical = hp <= 1; 

  // Gộp các class trạng thái
  const statusClass = isCritical ? `${styles.critical} ${styles.danger}` : styles.normal;

  // Hàm lấy mặt (giữ nguyên logic của bạn nhưng bọc trong statusClass)
  const getFace = () => {
    if (hp <= 0) return "💀";
    if (hp <= 1) return progress.streak >= 4 ? "😵‍💫" : "😵";
    if (hp <= 2) return "😰";
    if (progress.streak >= 6) return "🔥";
    if (progress.streak >= 4) return "😎";
    if (hp === MAX_HP) return "😄";
    return "🙂";
  };

  /* ================= RENDER ================= */

  const currentDay = days.find(d => d.id === progress?.dayId)

  const stageNumberInDay = (() => {
    if (!currentDay?.stages?.length || !progress?.stageId) return null

    const index = currentDay.stages.findIndex(
      (s: any) => s.id === progress.stageId
    )

    return index >= 0 ? index + 1 : null
  })()

  return (
    <div
      className={`${styles.game} ${isLocked ? styles.locked : ""}`}
      onPointerDownCapture={() => {
        void unlockAudioContext()
      }}
    >

    {/* HEADER */}
    <div className={styles.hudShell}>

      {/* TOP */}
      <div className={styles.topBar}>

        {/* LEFT */}
        <button
          className={styles.homeBtn}
          onClick={() => window.location.href = "/"}
        >
          <span className="material-symbols-rounded">
            arrow_back_ios_new
          </span>
        </button>

        <div className={styles.stageInfo}>

          <div className={styles.dayLabel}>
            {/* Phần text hiển thị: Ngày + Order + Tên */}
            <span className={styles.dayText}>
              Ngày {dayMeta?.order ?? progress.dayId}
              {dayMeta?.name && `: ${dayMeta.name}`}
            </span>
            
            {/* Label ôn lại nếu có */}
            {isReplay && (
              <span className={styles.replayPill}>Ôn lại</span>
            )}
          </div>

          <div className={styles.stageTitle}>
            Màn {stageNumberInDay || progress.stageId}
            {progress.stageName && ` : ${progress.stageName}`}
          </div>

        </div>

        
        {/* RIGHT - compact player */}
        {!isReplay && (
        <div className={styles.playerMini}>

          <div className={styles.playerTop}>
            <span className={styles.levelText}>
              Lv {progress.level}
            </span>

            <span className={styles.rankMini}>
              {rankName}
            </span>
          </div>

          {/* XP BAR INSIDE PLAYER */}
          <div className={styles.xpTrackWrapper}>

            <div className={styles.levelTrack}>
              <div
                className={styles.levelFill}
                style={{
                  width: `${levelInfo.ratio * 100}%`
                }}
              />
            </div>

          </div>

          <div className={styles.resourceRow}>
            <div className={styles.coinBadge}>
              <span className="material-symbols-rounded">paid</span>
               {(progress.coins ?? 0).toLocaleString("en-US")}
            </div>

            <div className={styles.xpBadge}>
              ⭐ {(progress.xp ?? 0).toLocaleString("en-US")}
            </div>
          </div>

        </div>
        )}

      </div>


      {/* SURVIVAL HUD */}
      <div className={`${styles.survivalHUD} ${statusClass}`}>
        <div className={styles.hudRow}>
          <span className={styles.hudLabel}>Tâm trạng</span>
          
          <div className={`${styles.hpTrack} ${isHit || skipEffect ? styles.damageFlash : ""}`}>
            <div
              className={styles.hpFill}
              style={{ 
                width: `${hpRatio * 100}%`,
                // Mẹo: Giữ kích thước gradient cố định so với Track cha
                backgroundSize: `${(1 / (hpRatio || 0.1)) * 100}% 100%`,
                backgroundPosition: 'left center'
              }}
            />
            
            <div
              className={styles.faceFloat}
              style={{ 
                // Dùng clamp để giới hạn mặt không lòi ra khỏi bo góc của thanh bar
                left: `calc(clamp(10px, ${hpRatio * 100}%, calc(100% - 10px)))` 
              }}
            >
              {getFace()}
            </div>
          </div>
        </div>
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
                    {String.fromCharCode(64 + index + 1)}
                  </div>
                  <div className={styles.choiceLabel}>
                    <div className={styles.mainText}>
                      {renderJapanese(c.text, c.reading)}
                    </div>
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

            {!isReplay && (
            <div className={styles.rewardPanel}>

              {/* COIN */}
              <div className={`${styles.rewardItem} ${coinAnimated < 0 ? styles.rewardPenalty : ""}`}>
                <span>Coin</span>

                <strong className={`${styles.valueRow} ${styles.coin}`}>
                  <span className="material-symbols-rounded">paid</span>
                  <span>
                    {coinAnimated > 0
                      ? `+${coinAnimated.toLocaleString()}`
                      : coinAnimated.toLocaleString()
                    }
                  </span>
                </strong>
              </div>

              {/* XP */}
              <div className={styles.rewardItem}>
                <span>XP</span>

                <strong className={`${styles.valueRow} ${styles.xp}`}>
                  ⭐
                  <span>+{xpAnimated.toLocaleString()}</span>
                </strong>
              </div>

            </div>
            )}

            {isReplay && (
              <div className={styles.practiceNote}>
                Ôn lại để luyện tập, không cộng XP, tiền hoặc level.
              </div>
            )}

            {leveledUp && (
              <div className={styles.levelUp}>
                <div className={styles.levelLabel}>
                  LEVEL UP
                </div>

                <div className={styles.levelValue}>
                  Lv {progress.level}
                </div>

                <div className={styles.rankName}>
                  {rankName}
                </div>
              </div>
            )}

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
