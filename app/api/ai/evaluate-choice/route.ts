import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  const { question, choice } = body

  const prompt = `
Bạn là người Nhật bản địa.

Tình huống:
${question}

Người dùng chọn cách trả lời:
"${choice}"

Hãy đánh giá:

1. Có phù hợp ngữ cảnh không
2. Có lịch sự không
3. Có tự nhiên không (giống người Nhật không)

Trả về JSON:

{
  "level": "good" | "ok" | "bad",
  "comment": "giải thích ngắn gọn",
  "suggestion": "cách nói tốt hơn (nếu có)",
  "tip": "1 điểm ngữ pháp hoặc văn hóa học được"
}
`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  })

  const data = await res.json()

  let result
  try {
    result = JSON.parse(data.choices[0].message.content)
  } catch {
    return NextResponse.json({ error: "AI parse error" }, { status: 500 })
  }

  return NextResponse.json(result)
}