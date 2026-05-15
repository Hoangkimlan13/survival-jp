"use client"

import styles from "./GameScreen.module.css"
import { renderJapanese } from "@/src/lib/renderJapanese"
import SpeakButton from "@/src/components/SpeakButton"
import { useEffect, useRef, useState, useMemo } from "react"
import { api } from "@/src/game/api"
import { getSmartMessage } from "@/src/game/utils"
import { preloadAudioContext, unlockAudioContext } from "@/src/game/sound"
import { getLevelProgress, getRankName, GAME_CONFIG } from "@/src/game/config"

export default function GameScreen({
  progress,
  current,
  selected,
  onAnswer,
  onNext,
  onSkip,   
  onUseCoin,     
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

  /* ================= STATES ================= */
  const [days, setDays] = useState<any[]>([])
  const [dayMeta, setDayMeta] = useState<{
    id: number
    name: string
    order: number
    stages?: { id: number }[]
  } | null>(null)
  const [isHit, setIsHit] = useState(false)
  const [xpAnimated, setXpAnimated] = useState(0)
  const [coinAnimated, setCoinAnimated] = useState(0)
  const [showIntro, setShowIntro] = useState(false)
  const [isExiting, setIsExiting] = useState(false);
  const [sceneData, setSceneData] = useState<any>(null)
  
  const selectedRef = useRef<HTMLButtonElement | null>(null)

  /* ================= MEMOIZED VALUES ================= */
  // Tính toán stageNumberInDay sớm để tránh lỗi undefined
  const stageNumberInDay = useMemo(() => {
    const currentDay = days.find(d => d.id === progress?.dayId)
    if (!currentDay?.stages?.length || !progress?.stageId) return null
    const index = currentDay.stages.findIndex((s: any) => s.id === progress.stageId)
    return index >= 0 ? index + 1 : null
  }, [days, progress?.dayId, progress?.stageId])

  const safeCurrent = current ?? null
  const safeChoices = safeCurrent?.choices ?? []
  const levelInfo = getLevelProgress(progress?.xp ?? 0)
  const rankName = getRankName(progress?.level ?? levelInfo.level)
  const currentTurn = Math.min(progress?.turn ?? 1, progress?.stageGoal ?? 1)
  
  /* ================= Thanh hỗ trọ ================= */
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => setStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    if (currentY - startY > 50) { // Nếu vuốt xuống hơn 50px
      setIsSupportOpen(false);
    }
  };


  /* ======= Reset khi sang câu mới đoạn dịch =====*/

  const [usedTranslate, setUsedTranslate] = useState(false);
  // Reset trạng thái đã trả tiền dịch khi sang câu hỏi mới
  useEffect(() => {
    if (current?.id) {
      setUsedTranslate(false);
    }
  }, [current?.id]); // Lắng nghe sự thay đổi của ID câu hỏi

  /* ======= Hàm hiện đỏ coin ở header =====*/
  const [isCoinDeducting, setIsCoinDeducting] = useState(false);

  // Hàm bọc lại onUseCoin để chạy hiệu ứng
  const handleUseCoin = (amount: number) => {
    onUseCoin?.(amount);
    setIsCoinDeducting(true);
    // Sau 500ms thì hết đỏ
    setTimeout(() => setIsCoinDeducting(false), 500);
  };

  /* ================= Âm THANH ================= */
  useEffect(() => {
    const resume = () => {
      unlockAudioContext()
    }

    window.addEventListener("pointerdown", resume)
    window.addEventListener("touchstart", resume)

    return () => {
      window.removeEventListener("pointerdown", resume)
      window.removeEventListener("touchstart", resume)
    }
  }, [])


  /* ================= EFFECTS ================= */

  // Load Days
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

  // Day Meta
  useEffect(() => {
    let active = true
    if (!progress?.dayId) {
      setDayMeta(null)
      return
    }
    api.getDay(progress.dayId).then(day => {
      if (active) setDayMeta(day ?? null)
    }).catch(() => {
      if (active) setDayMeta(null)
    })
    return () => { active = false }
  }, [progress?.dayId])

  // Preload Audio
  useEffect(() => {
    preloadAudioContext()
  }, [])

  // HP Hit Effect
  useEffect(() => {
    if (selected?.quality === "BAD") {
      setIsHit(true)
      const t = setTimeout(() => setIsHit(false), 300)
      return () => clearTimeout(t)
    }
  }, [selected])

  // XP & Coin Animation
  useEffect(() => {
    if (phase !== "result") return

    let xpFrame = 0
    let coinFrame = 0
    const xpDuration = 650
    const coinDuration = 950
    const xpStart = performance.now()
    const xpTarget = xpGain || 0
    const coinTarget = coinGain || 0

    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    setXpAnimated(0)
    setCoinAnimated(0)

    const animateXp = (now: number) => {
      const elapsed = now - xpStart
      const prog = Math.min(elapsed / xpDuration, 1)
      setXpAnimated(Math.round(xpTarget * easeOutExpo(prog)))
      if (prog < 1) xpFrame = requestAnimationFrame(animateXp)
    }

    const animateCoin = (now: number) => {
      const elapsed = now - xpStart - 140
      if (elapsed < 0) {
        coinFrame = requestAnimationFrame(animateCoin)
        return
      }
      const prog = Math.min(elapsed / coinDuration, 1)
      setCoinAnimated(Math.round(coinTarget * easeOutExpo(prog)))
      if (prog < 1) coinFrame = requestAnimationFrame(animateCoin)
    }

    xpFrame = requestAnimationFrame(animateXp)
    coinFrame = requestAnimationFrame(animateCoin)
    return () => {
      cancelAnimationFrame(xpFrame)
      cancelAnimationFrame(coinFrame)
    }
  }, [phase, currentTurn, xpGain, coinGain])

  // Scroll to selected
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [selected])

  // Reset Translate
  useEffect(() => {
    setShowTranslate?.(false)
  }, [safeCurrent, setShowTranslate])

  // Intro Logic
  useEffect(() => {
    if (!progress?.stageId) return
    let active = true
    setShowIntro(false)
    setSceneData(null)

    const isSeen = typeof window !== "undefined" && localStorage.getItem(`intro_seen_${progress.stageId}`) === "1"

    api.getStageIntro(progress.stageId).then((scene) => {
      if (!active || !scene) return
      setSceneData(scene)
      if (!isReplay && !isSeen) setShowIntro(true)
    }).catch(() => {
      setSceneData(null)
      setShowIntro(false)
    })
    return () => { active = false }
  }, [progress?.stageId, isReplay])

  /* ================= CONDITIONAL RENDERS ================= */

    // 1. Event Screens
  if (event?.type === "story") {
    return (
      <div className={styles.endingScreen}>
        <div className={styles.endingCard}>

          {/* TITLE */}
          <h1>{event.data?.title || "Story"}</h1>

          {/* IMAGE */}
          {event.data?.image && (
            <div className={styles.endingImageWrap}>
              <img src={event.data.image} />
            </div>
          )}

          {/* CONTENT */}
          <p>{event.data?.content}</p>

          {/* ================= HUD STYLE GAME ================= */}
          <div className={styles.storyPlayerProfile}>
            
            {/* Header: Level & Rank */}
            <div className={styles.storyPlayerHeader}>
              <div className={styles.storyLevelBadge}>
                <span className={styles.lvlLabel}>LEVEL</span>
                <span className={styles.lvlValue}>{progress?.level ?? levelInfo.level}</span>
              </div>
              <div className={styles.storyRankName}>
                {rankName}
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className={styles.storyXpSection}>
              <div className={styles.storyXpBarWrapper}>
                <div 
                  className={styles.storyXpFill} 
                  style={{ width: `${(levelInfo?.ratio ?? 0) * 100}%` }}
                />
                <span className={styles.xpPercentText}>
                  {Math.round((levelInfo?.ratio ?? 0) * 100)}%
                </span>
              </div>
              
            </div>

            {/* Resources Row: Coins & Total XP */}
            <div className={styles.storyResourceRow}>
              {/* COIN */}
              <div className={styles.storyResourceItem}>
                <span className="material-symbols-rounded" style={{ color: '#ffc857' }}>paid</span>
                <span className={`${styles.resValue} ${styles.resCoin}`}>
                  {(progress?.coins ?? 0).toLocaleString()}
                </span>
              </div>

              {/* XP */}
              <div className={styles.storyResourceItem}>
                <span className={styles.resIcon}>⭐</span>
                <span className={`${styles.resValue} ${styles.resXp}`}>
                  {(progress?.xp ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* ACTIONS */}
          <div className={styles.endingActions}>
            <button className={styles.nextBtn} onClick={onNext}>
              Tiếp tục
            </button>

            <button
              className={styles.homeBtnSecondary}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/"
                }
              }}
            >
              Tạm nghỉ
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
          <h1 className={styles.endingTitle}>{event.data?.title || "Ending"}</h1>
          {event.data?.image && <div className={styles.endingImageWrap}><img src={event.data.image} alt="ending" /></div>}
          <p className={styles.endingMessage}>{event.data?.message}</p>
          <div className={styles.endingType}>
            {event.data?.type === "GOOD" && "✨ Good Ending"}
            {event.data?.type === "NORMAL" && "⚖ Normal Ending"}
            {event.data?.type === "BAD" && "💀 Bad Ending"}
          </div>

          {/* ================= HUD STYLE GAME ================= */}
          <div className={styles.storyPlayerProfile}>
            
            {/* Header: Level & Rank */}
            <div className={styles.storyPlayerHeader}>
              <div className={styles.storyLevelBadge}>
                <span className={styles.lvlLabel}>LEVEL</span>
                <span className={styles.lvlValue}>{progress?.level ?? levelInfo.level}</span>
              </div>
              <div className={styles.storyRankName}>
                {rankName}
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className={styles.storyXpSection}>
              <div className={styles.storyXpBarWrapper}>
                <div 
                  className={styles.storyXpFill} 
                  style={{ width: `${(levelInfo?.ratio ?? 0) * 100}%` }}
                />
                <span className={styles.xpPercentText}>
                  {Math.round((levelInfo?.ratio ?? 0) * 100)}%
                </span>
              </div>
              
            </div>

            {/* Resources Row: Coins & Total XP */}
            <div className={styles.storyResourceRow}>
              {/* COIN */}
              <div className={styles.storyResourceItem}>
                <span className="material-symbols-rounded" style={{ color: '#ffc857' }}>paid</span>
                <span className={`${styles.resValue} ${styles.resCoin}`}>
                  {(progress?.coins ?? 0).toLocaleString()}
                </span>
              </div>

              {/* XP */}
              <div className={styles.storyResourceItem}>
                <span className={styles.resIcon}>⭐</span>
                <span className={`${styles.resValue} ${styles.resXp}`}>
                  {(progress?.xp ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          <div className={styles.endingActions}>
            <button className={styles.nextBtn} onClick={onNext}>Sang ngày tiếp theo</button>
            <button className={styles.homeBtnSecondary} onClick={() => window.location.href = "/"}>Về Home</button>
          </div>
        </div>
      </div>
    )
  }

  // Final & Replay events (giữ nguyên logic của bạn...)
  if (event?.type === "final") {
    return (
        <div className={`${styles.endingScreen} ${styles.final}`}> 
          <div className={styles.fireworks}><span/><span/><span/><span/><span/><span/></div>
          <div className={styles.endingCard}>
            <h1 className={styles.endingTitle}>{event.data?.title || "Hành trình hoàn tất"}</h1>
            {event.data?.image && <div className={styles.endingImageWrap}><img src={event.data.image} alt="final" /></div>}
            <p className={styles.endingMessage}>{event.data?.message || "Bạn đã hoàn thành mọi thử thách!"}</p>
            <div className={styles.endingActions}>
              <button className={styles.nextBtn} onClick={() => window.location.href = "/"}>Về Home</button>
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
            <h1 className={styles.endingTitle}>{event.data?.title || "Luyện tập hoàn tất"}</h1>
            <p className={styles.endingMessage}>{event.data?.message || "Bạn đã ôn lại màn này."}</p>
            <div className={styles.endingActions}>
              <button className={styles.nextBtn} onClick={onNext}>Về hồ sơ</button>
            </div>
          </div>
        </div>
      )
  }

  // 2. Intro Stage
  if ((showIntro || isExiting) && sceneData) {
    return (
      <div className={`${styles.introOverlay} ${isExiting ? styles.fadeOut : ''}`}>
        <div className={`${styles.introCard} ${isExiting ? styles.popOut : ''}`}>
          {sceneData.image && (
            <div className={styles.introImage}>
              <img src={sceneData.image} alt="Stage Intro" />
              <div className={styles.imageOverlay}></div>
            </div>
          )}
          
          <div className={styles.introContent}>
            <div className={styles.titleWrapper}>
              <span className={styles.subtitle}>HÀNH TRÌNH MỚI</span>
              <h2 className={styles.introTitle}>{sceneData.title}</h2>
            </div>
            
            <p className={styles.introText}>{sceneData.content}</p>
            
            <button 
              className={styles.introStartBtn} 
              onClick={async () => {
                // 1. Kích hoạt animation đóng
                setIsExiting(true);
                
                // 2. Chờ animation chạy xong (khoảng 400ms) rồi mới xóa hẳn
                setTimeout(() => {
                  setShowIntro(false);
                  setIsExiting(false);
                }, 400);

                // 3. Logic API giữ nguyên
                localStorage.setItem(`intro_seen_${progress.stageId}`, "1");
                await api.markIntroSeen(progress.stageId).catch(() => {});
              }}
            >
              <span>{sceneData.buttonText || "Bắt đầu ngay"}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Loading
  if (!progress || !safeCurrent || isLoadingQuestion) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>Đang tải câu hỏi...</div>
        </div>
      </div>
    )
  }



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

          <div className={styles.stageSub}>
            Câu {currentTurn} / {progress.stageGoal}
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
            <div className={`${styles.coinBadge} ${isCoinDeducting ? styles.coinLoss : ""}`}>
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
          {/* NÚT FAB MỞ MENU */}
          <button
            className={`${styles.fab} ${styles.supportFab}`}
            onClick={() => setIsSupportOpen(true)}
          >
            <span className="material-symbols-rounded">tips_and_updates</span>
            <span className={styles.fabLabel}>Hỗ trợ</span>
          </button>

          {/* OVERLAY MỜ */}
          <div 
            className={`${styles.sheetOverlay} ${isSupportOpen ? styles.show : ""}`} 
            onClick={() => setIsSupportOpen(false)} 
          />

          {/* BOTTOM SHEET */}
          <div 
            className={`${styles.bottomSheet} ${isSupportOpen ? styles.open : ""}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <div className={styles.sheetHandle} onClick={() => setIsSupportOpen(false)}></div>
            <h3 className={styles.sheetTitle}>Công cụ hỗ trợ</h3>
            
            <div className={styles.sheetGrid}>
              {/* TRANSLATE */}
              <button
                className={`
                  ${styles.sheetItem} 
                  ${showTranslate ? styles.active : ""} 
                  ${(!usedTranslate && progress.coins < GAME_CONFIG.SUPPORT_COST.TRANSLATE) ? styles.disabled : ""}
                `}
                onClick={() => {
                  // Nếu đã thanh toán rồi (usedTranslate), cho phép bật/tắt tự do
                  if (usedTranslate) {
                    setShowTranslate?.(!showTranslate);
                    setIsSupportOpen(false);
                    return;
                  }

                  const cost = GAME_CONFIG.SUPPORT_COST.TRANSLATE;
                  // Nếu không đủ tiền, không làm gì cả (nút đã bị mờ)
                  if (progress.coins < cost) return;

                  handleUseCoin(cost);
                  setUsedTranslate(true);
                  setShowTranslate?.(true);
                  setIsSupportOpen(false);
                }}
              >
                <div className={styles.itemIcon}>
                  <span className="material-symbols-rounded">
                    {/* Hiện icon khóa nếu không đủ tiền và chưa mua */}
                    {(!usedTranslate && progress.coins < GAME_CONFIG.SUPPORT_COST.TRANSLATE) 
                      ? "lock" 
                      : (showTranslate ? "visibility_off" : "translate")}
                  </span>
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>Dịch tình huống</span>
                  <span className={`
                    ${styles.itemCost} 
                    ${(!usedTranslate && progress.coins < GAME_CONFIG.SUPPORT_COST.TRANSLATE) ? styles.insufficient : ""}
                  `}>
                    {usedTranslate ? "Đã mở khóa" : `Phí: ${GAME_CONFIG.SUPPORT_COST.TRANSLATE} Coin`}
                  </span>
                </div>
              </button>

              {/* SKIP (VÉ THÔNG HÀNH) */}
              <button
                className={`
                  ${styles.sheetItem} 
                  ${progress.coins < GAME_CONFIG.SUPPORT_COST.SKIP ? styles.disabled : ""}
                `}
                onClick={() => {
                  const cost = GAME_CONFIG.SUPPORT_COST.SKIP;
                  if (progress.coins < cost) return;

                  handleUseCoin(cost);
                  onSkip();                 
                  setIsSupportOpen(false);  
                }}
              >
                <div className={`${styles.itemIcon} ${styles.skipIcon}`}>
                  <span className="material-symbols-rounded">
                    {progress.coins < GAME_CONFIG.SUPPORT_COST.SKIP ? "lock" : "fast_forward"}
                  </span>
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>Bỏ qua tình huống</span>
                  <span className={`
                    ${styles.itemCost} 
                    ${progress.coins < GAME_CONFIG.SUPPORT_COST.SKIP ? styles.insufficient : ""}
                  `}>
                    Phí: {GAME_CONFIG.SUPPORT_COST.SKIP} Coin
                  </span>
                </div>
              </button>

              <button className={styles.sheetItem} onClick={() => alert("Cảm ơn bạn!")}>
                <div className={styles.itemIcon}><span className="material-symbols-rounded">chat_bubble</span></div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>Góp ý & Báo lỗi</span>
                  <span className={styles.itemCost}>Miễn phí</span>
                </div>
              </button>
            </div>
          </div>
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
