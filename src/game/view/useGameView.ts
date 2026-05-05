export function useGameView(game: any) {

  const isLocked =
    game.phase === "answering" ||
    game.phase === "transition"

  const canAnswer = game.phase === "idle"

  const showResult = game.phase === "result"

  return {
    ...game,
    event: game.event, // 🔥 THÊM DÒNG NÀY
    isLocked,
    canAnswer,
    showResult
  }
}