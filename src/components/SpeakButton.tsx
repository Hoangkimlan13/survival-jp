"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  hasJapaneseSpeechText,
  prepareSpeechSynthesis,
  speak,
  stopSpeak
} from "@/lib/tts"
import { playClick } from "@/src/game/sound"
import styles from "@/styles/game.module.css"

let activeButtonId: string | null = null

export default function SpeakButton({
  text,
  variant = "card"
}: {
  text: string
  variant?: "small" | "card" | "inline"
}) {
  const [playing, setPlaying] = useState(false)
  const reactId = useId()
  const buttonIdRef = useRef(reactId)
  const hasJapanese = hasJapaneseSpeechText(text)

  useEffect(() => {
    prepareSpeechSynthesis()

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
    if (!hasJapanese || playing) return

    const buttonId = buttonIdRef.current

    prepareSpeechSynthesis()

    if (activeButtonId && activeButtonId !== buttonId) {
      window.dispatchEvent(
        new CustomEvent("speakStop", { detail: { id: activeButtonId } })
      )
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
      type="button"
      onPointerDown={prepareSpeechSynthesis}
      onClick={handleSpeak}
      disabled={!hasJapanese}
      aria-label={hasJapanese ? "Phát âm tiếng Nhật" : "Không có tiếng Nhật để phát âm"}
      title={hasJapanese ? "Phát âm tiếng Nhật" : "Câu này không có tiếng Nhật"}
      className={`
        ${styles.speakBtn}
        ${styles[variant === "card" ? "speakCard" : "speakSmall"]}
        ${playing ? styles.playing : ""}
        ${!hasJapanese ? styles.disabled : ""}
      `}
    >
      {!playing && (
        <span className="material-symbols-rounded">
          {hasJapanese ? "volume_up" : "volume_off"}
        </span>
      )}

      {playing && (
        <span className={styles.audioWave}>
          <i /><i /><i /><i /><i />
        </span>
      )}
    </button>
  )
}
