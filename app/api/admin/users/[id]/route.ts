import { prisma } from "@/lib/prisma"
import { checkAdmin } from "@/lib/checkAdmin"
import bcrypt from "bcryptjs"

/* UPDATE */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin()
  if (auth instanceof Response) return auth

  try {
    const { id } = await context.params
    const userId = Number(id)

    if (!userId) {
      return Response.json({ error: "INVALID_ID" }, { status: 400 })
    }

    const body = await req.json()

    // check trùng username (trừ chính nó)
    const existing = await prisma.adminUser.findFirst({
      where: {
        username: body.username,
        NOT: { id: userId }
      }
    })

    if (existing) {
      return Response.json(
        { error: "USERNAME_EXISTS" },
        { status: 400 }
      )
    }

    let data: any = {
      username: body.username
    }

    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10)
    }

    const user = await prisma.adminUser.update({
      where: { id: userId },
      data
    })

    return Response.json({
      id: user.id,
      username: user.username
    })

  } catch (err: any) {
    return Response.json(
      { error: "UPDATE_FAILED", message: err.message },
      { status: 500 }
    )
  }
}

/* DELETE */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdmin()
  if (auth instanceof Response) return auth

  try {
    const { id } = await context.params
    const userId = Number(id)

    if (!userId) {
      return Response.json({ error: "INVALID_ID" }, { status: 400 })
    }

    const existing = await prisma.adminUser.findUnique({
      where: { id: userId }
    })

    if (!existing) {
      return Response.json(
        { error: "USER_NOT_FOUND" },
        { status: 404 }
      )
    }

    await prisma.adminUser.delete({
      where: { id: userId }
    })

    return Response.json({ ok: true })

  } catch (err: any) {
    return Response.json(
      { error: "DELETE_FAILED", message: err.message },
      { status: 500 }
    )
  }
}