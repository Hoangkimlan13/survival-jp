export async function POST(req: Request) {
  try {
    const { context } = await req.json()

    const prompt = `
Bạn là game designer.
Viết story ngắn 2-3 câu.

Context: ${context}
`

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    })

    if (!ai.ok) {
      const err = await ai.text()
      return new Response(err, { status: 500 })
    }

    const json = await ai.json()

    const story = json?.choices?.[0]?.message?.content

    if (!story) {
      return new Response("No story generated", { status: 500 })
    }

    return Response.json({
      story,
      title: context || "AI Story"
    })
  } catch (e) {
    return new Response("SERVER_ERROR", { status: 500 })
  }
}