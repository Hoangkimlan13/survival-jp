import { parseJapanese } from "@/src/server/jpParser"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const { text } = await req.json()

  const result = await parseJapanese(text)

  return Response.json(result)
}