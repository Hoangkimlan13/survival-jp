"use client"

import { useState, useRef, useEffect } from "react"
import { speak, stopSpeak } from "@/lib/tts"
import { playClick } from "@/src/game/sound"
import styles from "@/styles/game.module.css"

// Global state để track button đang active
let activeButtonId: string | null = null

export default function SpeakButton({
  text,
  variant = "card"
}: {
  text: string
  variant?: "small" | "card" | "inline"
}) {
  const [playing, setPlaying] = useState(false)
  const buttonIdRef = useRef(Math.random().toString(36))
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(text)

  useEffect(() => {
    const handleStop = (event: CustomEvent) => {
      if (event.detail?.id === buttonIdRef.current) {
        setPlaying(false)
        stopSpeak()
      }
    }

    window.addEventListener("speakStop", handleStop as EventListener)
    return () => {
      window.removeEventListener("speakStop", handleStop as EventListener)
    }
  }, [])

  const handleSpeak = async () => {
    const buttonId = buttonIdRef.current

    if (playing) return

    // Stop other button nếu có
    if (activeButtonId && activeButtonId !== buttonId) {
      const event = new CustomEvent("speakStop", { detail: { id: activeButtonId } })
      window.dispatchEvent(event)
      stopSpeak()
    }

    setPlaying(true)
    activeButtonId = buttonId
    playClick()

    await speak(text, undefined, () => {
      setPlaying(false)
      if (activeButtonId === buttonId) {
        activeButtonId = null
      }
    })
  }

  return (
    <button
      onClick={hasJapanese ? handleSpeak : undefined}
      disabled={!hasJapanese}
      className={`
        ${styles.speakBtn}
        ${styles[variant === "card" ? "speakCard" : "speakSmall"]}
        ${playing ? styles.playing : ""}
        ${!hasJapanese ? styles.disabled : ""}
      `}
    >
      {/* ICON biến mất khi speaking */}
      {!playing && (
        <span className="material-symbols-rounded">
          volume_up
        </span>
      )}

      {/* WAVE PRO */}
      {playing && (
        <span className={styles.audioWave}>
          <i /><i /><i /><i /><i />
        </span>
      )}
    </button>
  )
}