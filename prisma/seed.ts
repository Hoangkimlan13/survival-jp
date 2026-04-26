import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  await prisma.AdminUser.create({
    data: {
      username: "admin",
      password: "123456" // (sau sẽ hash)
    }
  })

  console.log("✅ Admin created")
}

main()