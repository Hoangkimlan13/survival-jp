import { engine } from "../engine"

export async function getNextQuestion(progress: any) {
  return await engine.loadQuestion(progress)
}

export async function getNextStage(progress: any) {
  return await engine.next(progress)
}