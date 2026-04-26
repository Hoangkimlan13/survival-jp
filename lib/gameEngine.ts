import { prisma } from "@/lib/prisma"

export async function getGameSession(modeCode: string, progress?: any) {
  const mode = await prisma.gameMode.findUnique({
    where: { code: modeCode }
  })

  if (!mode) throw new Error("Mode not found")

  const config: any = mode.config

  switch (config.type) {
    case "story":
      return getStoryFlow(progress)

    case "survival":
      return getSurvivalQuestions(config)

    case "challenge":
      return getHotQuestions(config)

    case "random":
      return getRandomQuestions()

    default:
      throw new Error("Unknown mode")
  }
}