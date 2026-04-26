import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { signToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "MISSING_FIELDS" },
        { status: 400 }
      )
    }

    const user = await prisma.adminUser.findFirst({
      where: { username }
    })

    if (!user) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS" },
        { status: 401 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS" },
        { status: 401 }
      )
    }

    const token = await signToken({
      id: user.id,
      role: "admin"
    })

    const res = NextResponse.json({ ok: true })

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // dev
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    })

    return res
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    )
  }
}