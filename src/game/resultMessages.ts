// src/game/resultMessages.ts

export type Quality = "PERFECT" | "GOOD" | "OK" | "BAD"

export const RESULT_MESSAGES: Record<Quality, string[]> = {
  PERFECT: [
    "🌟 Tuyệt vời!",
    "🔥 Đỉnh cao!",
    "💯 Không chê vào đâu được!",
    "🚀 Quá chuẩn!",
    "⚡ Chuẩn từng pixel!",
    "👑 Đẳng cấp thật sự",
    "💥 One shot!",
    "🎯 Hoàn hảo!"
  ],
  GOOD: [
    "👍 Tốt lắm!",
    "👌 Ổn áp!",
    "😎 Nice!",
    "✨ Làm tốt!",
    "🔥 Đang vào form",
    "📈 Càng ngày càng ổn",
    "💪 Tiếp tục nhé!"
  ],
  OK: [
    "👌 Tạm ổn",
    "🙂 Không tệ",
    "🤏 Gần đúng rồi",
    "😐 Cũng được",
    "🧠 Có tiềm năng đó",
    "⚖️ Ổn nhưng chưa chắc"
  ],
  BAD: [
    "❌ Sai rồi!",
    "😅 Thử lại nhé",
    "💡 Nghĩ lại chút",
    "⚠️ Không ổn rồi",
    "😬 Hơi sai hướng rồi",
    "🧨 Gãy rồi, bình tĩnh",
    "🧠 Xem lại logic nhé"
  ]
}