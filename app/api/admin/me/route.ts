import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value

  if (!token) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    )
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: "INVALID_TOKEN" },
      { status: 401 }
    )
  }

  return NextResponse.json({ user: payload })
}