"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { getProgress, type ProgressLog } from "@/lib/progress"
import { unlockAudioContext } from "@/src/game/sound"
import { getRankName, getLevelProgress, formatCompactNumber } from "@/src/game/config"


type ThemeMode = "system" | "dark" | "light"

export default function HomePage() {
  const router = useRouter()

  // ===== STATE =====
  const [theme, setTheme] = useState<ThemeMode>("system")
  const [dark, setDark] = useState(false)

  const [progress, setProgressState] = useState<any>(undefined)

  const [days, setDays] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])

  const [expanded, setExpanded] = useState(false)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)

  const [showHint, setShowHint] = useState(true)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return

    const el = sheetRef.current

    const isAtTop = el.scrollTop <= 0
    const isAtBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 1

    const y = e.touches[0].clientY
    const delta = startY.current - y

    if (
      (delta > 0 && isAtTop) ||
      (delta < 0 && isAtBottom)
    ) {
      // ❌ KHÔNG preventDefault ở đây nữa
      moveDrag(y)
    }
  }

  const handleNavigate = (path: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation() // 🔥 ngăn sheet nhận event
    isDragging.current = false // 🔥 cancel drag ngay lập tức

    router.push(path)
  }

  const isInteractiveElement = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return target.closest("button, a")
  }


  useEffect(() => {
    const seen = localStorage.getItem("sheet_hint_done")
    if (seen) setShowHint(false)
  }, [])

  const handleInteract = () => {
    setShowHint(false)
    localStorage.setItem("sheet_hint_done", "1")
  }
  
  const isDragging = useRef(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  

  const startDrag = (y: number) => {
    isDragging.current = true
    startY.current = y
  }

  const moveDrag = (y: number) => {
    if (!isDragging.current) return

    currentY.current = y 

    const delta = startY.current - y

    document.documentElement.style.setProperty(
      "--sheet-offset",
      `${Math.max(0, delta)}px`
    )
  }

  const endDrag = () => {
    if (!isDragging.current) return
    isDragging.current = false

    const delta = startY.current - currentY.current

    document.documentElement.style.setProperty("--sheet-offset", "0px") 

    if (delta > 50) setExpanded(true)
    else if (delta < -50) setExpanded(false)
  }

  useEffect(() => {
    if (!isTouchDevice) {
      setExpanded(true) 
    }
  }, [isTouchDevice])


  useEffect(() => {
    const el = sheetRef.current
    if (!el) return

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return

      const isAtTop = el.scrollTop <= 0
      const isAtBottom =
        el.scrollHeight - el.scrollTop <= el.clientHeight + 1

      const y = e.touches[0].clientY
      const delta = startY.current - y

      if (
        (delta > 0 && isAtTop) ||
        (delta < 0 && isAtBottom)
      ) {
        e.preventDefault() // ✅ GIỜ mới hợp lệ
      }
    }

    el.addEventListener("touchmove", onTouchMove, {
      passive: false, // 🔥 bắt buộc
    })

    return () => {
      el.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  
  // ===== LOAD PROGRESS =====
  useEffect(() => {
    const load = () => {
      const p = getProgress()
      setProgressState(p)
    }

    load()

    const onFocus = () => load()
    const onStorage = (event: StorageEvent) => {
      if (event.key === "progress") load()
    }

    window.addEventListener("focus", onFocus)
    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  // ===== LOAD LEVELS FROM API =====
  useEffect(() => {
    fetch("/api/days")
      .then(res => res.json())
      .then(setDays)
  }, [])

  useEffect(() => {
    const dayId = progress?.dayId ?? 1

    fetch(`/api/stages?dayId=${dayId}`)
      .then(res => res.json())
      .then(setStages)
  }, [progress?.dayId])

  // ===== INIT THEME =====
  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null

    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches

    const mode = saved || "system"
    setTheme(mode)

    const isDark =
      mode === "dark" || (mode === "system" && systemDark)

    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

   // ===== Mở âm thanh =====
   const [sound, setSound] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sound")
    setSound(saved === "on")
  }, [])

  // ===== APPLY THEME =====
  const applyTheme = (mode: ThemeMode) => {
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches

    let isDark = false

    if (mode === "dark") isDark = true
    else if (mode === "light") isDark = false
    else isDark = systemDark

    setTheme(mode)
    setDark(isDark)

    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("theme", mode)
  }
  


  const getSurvivalStatus = (progress: any) => {
    const hp = Number(progress?.hp ?? 5)
    const streak = Number(progress?.streak ?? 0)
    const day = Number(progress?.dayId ?? 1)
    const stage = Number(progress?.stageId ?? 1)
    const history: ProgressLog[] = Array.isArray(progress?.history) ? progress.history : []

    // ===== CALCULATE DAY-WIDE PERFORMANCE =====
    const calculateDayPerformance = () => {
      if (history.length === 0) return { accuracy: 0, perfectCount: 0, badCount: 0, totalAnswered: 0 }

      const perfectCount = history.filter(h => h.result === "PERFECT").length
      const goodCount = history.filter(h => h.result === "GOOD").length
      const okCount = history.filter(h => h.result === "OK").length
      const badCount = history.filter(h => h.result === "BAD").length
      const totalAnswered = history.length

      // Score: PERFECT=100, GOOD=75, OK=50, BAD=0
      const totalScore = perfectCount * 100 + goodCount * 75 + okCount * 50
      const accuracy = totalScore / (totalAnswered * 100)

      return { accuracy, perfectCount, badCount, totalAnswered }
    }

    const dayPerf = calculateDayPerformance()
    const hasHistory = history.length > 0

    const pick = (messages: string[]) => {
      const seed = day * 13 + stage * 7 + hp * 5 + streak * 11 + (dayPerf.accuracy * 3 || 0)
      return messages[seed % messages.length]
    }

    // NO PROGRESS: First time or just reset
    if (!progress) {
      return pick([
        "Hành trình bắt đầu! 🎌",
        "Sắp sàng để sống sót?",
        "Ngày đầu chờ rồi..."
      ])
    }

    // NEW DAY: Progress exists but no answers yet in current stage/day
    if (!hasHistory) {
      return pick([
        `Ngày ${day} bắt đầu! HP: ${hp}/5 💚`,
        `Chuỗi sống sót: ${streak} | Sẵn sàng chưa?`,
        `Vào trận ngày ${day}!`
      ])
    }

    // CRITICAL SITUATION: Low HP + many bad answers = extreme danger
    if (hp <= 1 && dayPerf.badCount >= 3) {
      return pick([
        `💀 Ngày ${day} CẤP BÁO! Sai lầm quá nhiều!`,
        `Máu chỉ còn 1... một nước nữa là game over!`,
        `Tuyệt vọng! Phải làm gì cứu được?`
      ])
    }

    if (hp <= 1) {
      return pick([
        `⚠️ Máu 1/5! Cảnh báo đỏ!`,
        `Sức mạnh cạn kiệt... mỗi quyết định đều quan trọng!`,
        `Đứng bờ vực rồi!`
      ])
    }

    // WARNING: Low HP + bad day performance
    if (hp <= 2 && dayPerf.accuracy < 0.5) {
      return pick([
        `🔥 Ngày ${day}: HP yếu + sai lầm tích lũy!`,
        `Máu thấp, hiệu suất tệ... nguy hiểm!`,
        `Cải thiện ngay không kìm được nữa!`
      ])
    }

    if (hp <= 2) {
      return pick([
        `⚡ Máu ${hp}/5, cẩn thận từng bước!`,
        `Sức khỏe yếu... chọn khôn ngoan!`,
        `Một sai lầm = game over!`
      ])
    }

    // EXCELLENT PERFORMANCE: High accuracy + good HP
    if (dayPerf.accuracy >= 0.8 && hp >= 4) {
      return pick([
        `✨ ${dayPerf.perfectCount} câu hoàn hảo! Phong độ đỉnh!`,
        `Đang làm chủ cuộc chơi! 👑`,
        `Bậc thầy sinh tồn!`
      ])
    }

    // VERY GOOD: Strong accuracy with current streak
    if (streak >= 5 && dayPerf.accuracy >= 0.6) {
      return pick([
        `🔥 Chuỗi ${streak}! Quá hay! `,
        `Vừa mạnh vừa thông minh!`,
        `Đang trên đà rồi!`
      ])
    }

    if (streak >= 5) {
      return pick([
        `💪 Chuỗi ${streak} lần sống sót!`,
        `Phong độ tốt, giữ nhịp!`,
        `Đắc nhân tâm!`
      ])
    }

    // MODERATE: Acceptable but needs improvement
    if (streak >= 3 && dayPerf.accuracy >= 0.5) {
      return pick([
        `👍 Ổn đấy, nhưng đừng chủ quan!`,
        `Đang đi đúng hướng, cố lên!`,
        `Sống sót được rồi, tiếp tục!`
      ])
    }

    // STRUGGLING: Low accuracy
    if (dayPerf.accuracy < 0.4) {
      return pick([
        `😅 Hôm nay không được tốt... phải cải thiện!`,
        `Sai lầm quá nhiều rồi!`,
        `Khó khăn nhưng vẫn có cơ hội!`
      ])
    }

    // DEFAULT: Regular day
    return pick([
      `Ngày ${day}, mỗi chọn lựa quyết định bạn!`,
      `Chiến thôi! 🎮`,
      `Tập trung tối đa!`
    ])
  }


  // ===== FIND CURRENT  =====
  const hasSavedGame = Boolean(
    progress && (
      (Array.isArray(progress.history) && progress.history.length > 0) ||
      progress.turn > 1 ||
      progress.dayId > 1 ||
      progress.stageId > 1 ||
      Number(progress.hp ?? 5) !== 5
    )
  )

  const currentDay =
    days.find(d => d.id === progress?.dayId) || days[0]

  const currentStage =
    stages.find(s => s.id === progress?.stageId) || stages[0]

  const levelInfo = getLevelProgress(progress?.xp ?? 0)

  return (
    <div className="app">


      {/* HEADER */}
      <div className="header">

        {/* LEFT HUD */}
        <div className="hudLeft">

          {/* LEVEL */}
          <div className="hudRank">
            <div className="lvBadge">
              Lv.{progress?.level ?? 1}
            </div>

            <div className="rankBox">
              <div className="rankName">
                {getRankName(progress?.level ?? 1)}
              </div>

              <div className="expBarWrap">
                <div className="expBar">
                  <div
                    className="expFill"
                    style={{ width: `${levelInfo.ratio * 100}%` }}
                  />
                </div>

                <div className="expPercent">
                  {Math.floor(levelInfo.ratio * 100)}%
                </div>
              </div>
            </div>
          </div>

        
          {/* COIN */}
          <div className="hudItem coin">
            <span className="material-symbols-rounded">paid</span>
            <span>{formatCompactNumber(progress?.coins ?? 0)}</span>
          </div>

          <div className="hudItem xp">
            <span className="xpStar">⭐</span>
            <span>{formatCompactNumber(progress?.xp ?? 0)}</span>
          </div>

        </div>

        {/* RIGHT - CONTROL */}
        <div className="controlGroup">

          {/* SOUND */}
          <button
            className={`iconBtn ${sound ? "active" : ""}`}
            onClick={() => {
              const newVal = !sound
              setSound(newVal)
              localStorage.setItem("sound", newVal ? "on" : "off")
              if (newVal) void unlockAudioContext()
            }}
          >
            <span className="material-symbols-rounded">
              {sound ? "volume_up" : "volume_off"}
            </span>
          </button>

          {/* THEME */}
          <button
            className="iconBtn"
            onClick={() => applyTheme(dark ? "light" : "dark")}
          >
            <span className="material-symbols-rounded">
              {dark ? "dark_mode" : "light_mode"}
            </span>
          </button>

        </div>

      </div>

      {/* SYSTEM BUTTON (optional nâng cao UX) */}
      <div className="theme-mini">
        <button onClick={() => applyTheme("system")}>
          Auto
        </button>
      </div>


      {/* HERO */}
      <div className="hero">
        <div className="hero-overlay" />
        
        <div className="hero-content">

          {/* Logo nằm chính giữa Hero */}
          <div className="hero-brand-area">
            <img src="/logo.png" className="logo-main" />
          </div>
        </div>
      </div>

      {/* SHEET */}

      <div
        className={`sheet ${expanded ? "expanded" : "collapsed"}`}
        ref={sheetRef}
        {...(isTouchDevice && {
          onTouchStart: (e) => {
            if (isInteractiveElement(e.target)) return 
            startDrag(e.touches[0].clientY)
          },
          onTouchMove: (e) => handleTouchMove(e),
          onTouchEnd: endDrag,
        })}
      >
        {/* HANDLE */}
        <div
          className={`dragHandle ${!showHint ? "noHint" : ""}`}
          onClick={() => {
            handleInteract()
            setExpanded(!expanded)
          }}
        >
          <div className="handle-bar" />

          <span className="material-symbols-outlined arrow">
            {expanded ? "expand_more" : "expand_less"}
          </span>
        </div>

        {/* STATUS */}
        <div className="status">
          <div className="status-head">
            <div>
              <p className="status-subtitle">Hành trình hiện tại</p>
              <p className="status-title">
                Ngày {currentDay?.order ?? 1}: {currentDay?.name ?? "Đang tải..."}
              </p>
            </div>
            <span className="status-chip">
              Màn {currentStage?.order ?? 1}
            </span>
          </div>

          <p className="status-stage">
            {currentStage?.name ?? "Đang tải..."}
          </p>

          <p className="status-feeling">
            {getSurvivalStatus(progress)}
          </p>
        </div>


        {/* PRIMARY */}
        <button
          className="btn primary"
          onClick={handleNavigate("/game")}
        >
          <span className="material-symbols-rounded">
            {hasSavedGame ? "play_circle" : "rocket_launch"}
          </span>

          {hasSavedGame ? "Tiếp tục" : "Bắt đầu"}
        </button>

        {/* SURVIVAL PROFILE */}
        <button
          className="btn"
          onClick={handleNavigate("/profile")}
        >
          <span className="material-symbols-rounded">badge</span>
          Hồ sơ sinh tồn
        </button>

        <div className="extraActions">
          <button className="btn">
            <span className="material-symbols-rounded">lightbulb</span>
            Gửi tình huống thật
          </button>

          <button
            className="btn danger"
            onClick={() => {
              localStorage.removeItem("progress")
              localStorage.removeItem("game_event") 
              location.reload()
            }}
          >
            Reset Game
          </button>
        </div>

      </div>
    </div>
  )
}
