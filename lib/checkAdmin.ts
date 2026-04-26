import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const payload = await verifyToken(token)

  if (!payload || payload.role !== "admin") {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  return payload
}