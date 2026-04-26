"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getProgress } from "@/lib/progress"

type ThemeMode = "system" | "dark" | "light"

export default function HomePage() {
  const router = useRouter()

  // ===== STATE =====
  const [theme, setTheme] = useState<ThemeMode>("system")
  const [dark, setDark] = useState(false)

  const [progress, setProgressState] = useState<any>(null)

  const [days, setDays] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])

  // ===== LOAD PROGRESS =====
  useEffect(() => {
    const p = getProgress()

    if (!p) {
      const defaultProgress = {
        dayId: 1,
        stageId: 1,
        turn: 1
      }

      setProgressState(defaultProgress)
    } else {
      setProgressState(p)
    }
  }, [])

  // ===== LOAD LEVELS FROM API =====
  useEffect(() => {
    fetch("/api/days")
      .then(res => res.json())
      .then(setDays)
  }, [])

  useEffect(() => {
    if (!progress?.dayId) return

    fetch(`/api/stages?dayId=${progress.dayId}`)
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
    if (!progress) return "Bắt đầu hành trình..."

    const hp = progress.hp ?? 5
    const streak = progress.streak ?? 0

    if (hp <= 1) return "Bạn đang sắp toang..."
    if (hp <= 2) return "Tình hình không ổn..."
    if (streak >= 5) return "Bạn đang rất tự tin"
    if (streak >= 3) return "Mọi thứ đang ổn"

    return "Hãy bắt đầu hành trình nào!!! "
  }


  // ===== FIND CURRENT  =====
  const currentDay =
    days.find(d => d.id === progress?.dayId) || days[0]

  const currentStage =
    stages.find(s => s.id === progress?.stageId) || stages[0]

  return (
    <div className="app">

      {/* HEADER */}
      <div className="header">

        {/* iOS STYLE SWITCH */}
        <div className={`track ${dark ? "on" : ""}`}
          onClick={() =>
            applyTheme(dark ? "light" : "dark")
          }
        >
          <div className="thumb">
            {dark ? "🌙" : "☀️"}
          </div>
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
        <img src="/bg.jpg" className="hero-bg" />

        <div className="hero-content">
          <img src="/logo.png" className="logo" />

          <p className="subtitle">
            Sinh tồn tại Nhật bằng tiếng Nhật
          </p>
        </div>
      </div>

      {/* SHEET */}
      <div className="sheet">

        {/* STATUS */}
        <div className="status">
          <p className="status-title">
            Ngày {currentDay?.order ?? 1}: {currentDay?.name ?? "Loading..."}
          </p>

          <p className="status-stage">
            Màn {currentStage?.order ?? 1} • {currentStage?.name ?? "Loading..."}
          </p>

          <p className="status-feeling">
            {getSurvivalStatus(progress)}
          </p>
        </div>

        {/* PRIMARY */}
        <button
          className="btn primary"
          onClick={() => router.push("/game")}
        >
          <span className="material-symbols-rounded">
            {progress ? "play_circle" : "rocket_launch"}
          </span>

          {progress ? "Tiếp tục" : "Bắt đầu"}
        </button>

        {/* SECONDARY */}
        <button className="btn">
          <span className="material-symbols-rounded">emoji_events</span>
          Thành tích
        </button>

        <button className="btn">
          <span className="material-symbols-rounded">lightbulb</span>
          Gửi tình huống thật
        </button>

        <button
          className="btn danger"
          onClick={() => {
            localStorage.removeItem("progress")
            location.reload()
          }}
        >
          Reset Game
        </button>

      </div>
    </div>
  )
}