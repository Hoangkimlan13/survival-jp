"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import GameScreen from "@/src/game/ui/GameScreen"
import { useGame } from "@/src/game/hooks/useGame"
import { useGameView } from "@/src/game/view/useGameView"

export default function GameClient() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "replay" ? "replay" : "play"
  const replayStageId = Number(searchParams.get("stageId") || 0) || null

  const game = useGame({ mode, replayStageId })
  const view = useGameView(game)

  const [showTranslate, setShowTranslate] = useState(false)

  useEffect(() => {
    if (!view.current?.id) return

    queueMicrotask(() => {
      setShowTranslate(false)
    })
  }, [view.current?.id])

  return (
    <GameScreen
      progress={view.progress}
      current={view.current}
      selected={view.selected}
      phase={view.phase}
      event={view.event}
      xpGain={view.xpGain}
      coinGain={view.coinGain}
      leveledUp={view.leveledUp}
      isReplay={view.isReplay}
      isLocked={view.isLocked}
      canAnswer={view.canAnswer}
      onAnswer={view.answer}
      onNext={view.next}
      onSkip={game.skip}
      onUseCoin={game.useCoin}
      skipEffect={game.skipEffect}
      showTranslate={showTranslate}
      setShowTranslate={setShowTranslate}
      prevStreak={game.prevStreak}
      isLoadingQuestion={game.isLoadingQuestion}
    />
  )
}
