import { prisma } from "@/lib/prisma"
import { checkAdmin } from "@/lib/checkAdmin"
import bcrypt from "bcryptjs"

/* GET */
export async function GET() {
  const auth = await checkAdmin()
  if (auth instanceof Response) return auth

  const users = await prisma.adminUser.findMany({
    orderBy: { id: "desc" },
    select: {
      id: true,
      username: true
    }
  })

  return Response.json(users)
}

/* CREATE */
export async function POST(req: Request) {
  const auth = await checkAdmin()
  if (auth instanceof Response) return auth

  try {
    const body = await req.json()

    const existing = await prisma.adminUser.findFirst({
      where: { username: body.username }
    })

    if (existing) {
      return Response.json(
        { error: "USERNAME_EXISTS" },
        { status: 400 }
      )
    }

    const hash = await bcrypt.hash(body.password, 10)

    const user = await prisma.adminUser.create({
      data: {
        username: body.username,
        password: hash
      }
    })

    return Response.json({
      id: user.id,
      username: user.username
    })

  } catch (err: any) {
    return Response.json(
      { error: "SERVER_ERROR", message: err.message },
      { status: 500 }
    )
  }
}