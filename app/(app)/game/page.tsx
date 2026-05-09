import GameClient from "./GameClient"
import { Suspense } from "react"

export default function GamePage() {
  return (
    <Suspense fallback={null}>
      <GameClient />
    </Suspense>
  )
}
