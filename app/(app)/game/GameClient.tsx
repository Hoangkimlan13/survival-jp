"use client"

import { useState, useEffect } from "react" // ✅ thêm useEffect
import GameScreen from "@/src/game/ui/GameScreen"
import { useGame } from "@/src/game/hooks/useGame"
import { useGameView } from "@/src/game/view/useGameView"

export default function GameClient() {
  const game = useGame()
  const view = useGameView(game)

  const [showTranslate, setShowTranslate] = useState(false)

  // RESET khi sang câu mới
  useEffect(() => {
    if (!view.current?.id) return
    setShowTranslate(false)
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
      isLocked={view.isLocked}
      canAnswer={view.canAnswer}
      onAnswer={view.answer}
      onNext={view.next}
      onSkip={game.skip}          
      skipEffect={game.skipEffect} 
      showTranslate={showTranslate}
      setShowTranslate={setShowTranslate}
      prevStreak={game.prevStreak}  
    />
  )
}
