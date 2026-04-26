import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function run() {
  const users = await prisma.adminUser.findMany()

  for (const u of users) {
    // nếu chưa phải hash
    if (!u.password.startsWith("$2")) {
      const hash = await bcrypt.hash(u.password, 10)

      await prisma.adminUser.update({
        where: { id: u.id },
        data: { password: hash }
      })

      console.log(`✔ Updated user ${u.username}`)
    }
  }

  console.log("DONE")
}

run()