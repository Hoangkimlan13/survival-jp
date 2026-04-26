import { cookies } from "next/headers"

export async function POST() {
  cookies().delete("admin")
  return Response.json({ ok: true })
}