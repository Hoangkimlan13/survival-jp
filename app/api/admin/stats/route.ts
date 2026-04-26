import { prisma } from "@/lib/prisma"

export async function GET() {
  const totalUsers = await prisma.adminUser.count()

  // giả lập (sau này bạn lưu real data)
  const plays = 120
  const completion = 65
  const drop = 35

  return Response.json({
    users: totalUsers,
    plays,
    completion,
    drop
  })
}