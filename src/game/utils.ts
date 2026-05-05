import { RESULT_MESSAGES, type Quality } from "./resultMessages"

export function getSmartMessage(
  quality: Quality,
  streak: number,
  prevStreak: number,
  seed?: number
) {
  const messages = RESULT_MESSAGES[quality]
  if (!messages?.length) return ""

  /* ================= PERFECT ================= */

  if (quality === "PERFECT") {
    if (streak >= 10) return "🔥 Vô đối! Không ai cản nổi!"
    if (streak >= 6) return "🚀 Combo cháy máy!"
    if (streak >= 3) return "✨ Đang vào form!"
  }

  /* ================= GOOD ================= */

  if (quality === "GOOD") {
    if (streak >= 6) return "😎 Chuỗi đẹp đấy!"
    if (streak >= 3) return "👍 Ổn áp!"
  }

  /* ================= BAD ================= */

  if (quality === "BAD") {
    if (prevStreak >= 6) return "💥 Gãy combo cực mạnh!"
    if (prevStreak >= 3) return "😵 Gãy chuỗi rồi!"
    if (prevStreak >= 1) return "😬 Mất đà rồi!"
    return "❌ Sai rồi!"
  }

  /* ================= OK ================= */

  if (quality === "OK") {
    if (streak >= 3) return "🙂 Giữ nhịp ổn đấy"
  }

  /* ================= RANDOM STABLE ================= */

  const index =
    seed !== undefined
      ? seed % messages.length
      : Math.floor(Math.random() * messages.length)

  return messages[index]
}