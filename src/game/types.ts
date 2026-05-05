/* =========================
   CORE GAME TYPES
========================= */

/* ====== CHOICE ====== */

export type ChoiceQuality = "PERFECT" | "GOOD" | "OK" | "BAD"

export type Choice = {
  id: number
  text: string
  translation?: string
  correct: boolean
  feedback: string
  reading?: ReadingItem[]
  quality?: ChoiceQuality
}

/* ====== READING ====== */

export type ReadingItem = {
  text: string
  reading?: string
}


/* ====== SCENARIO / QUESTION ====== */

export type Scenario = {
  id: number
  stageId: number
  question: string
  translation: string
  hint?: string
  reading?: ReadingItem[]
  choices: Choice[]

  // ✅ dùng cho engine
  used: boolean
}

/* ====== ANSWER LOG ====== */

export type AnswerResult = "GOOD" | "MEDIUM" | "BAD" | "SKIP"

export type AnswerLog = {
  questionId: number
  choiceId: number | null
  result: AnswerResult
  xpGain: number
}


export type Story = {
  id: number
  title?: string
  content: string

  trigger?: string
  isActive?: boolean
  isDraft?: boolean

  weight?: number
  rarity?: number
}

/* ====== ENDING TYPE ====== */

export type EndingType = "good" | "normal" | "bad"

/* ====== STAGE ====== */

export type Stage = {
  id: number
  name: string
  order: number
  isPublished?: boolean
}


export type Ending = {
  id: number
  type: EndingType
  title: string
  message: string
  image?: string | null
}

/* ====== GAME FEEDBACK UI STATE ====== */

export type FeedbackFeeling = "GOOD" | "MEDIUM" | "BAD"

/* =========================
   ENGINE RESULT TYPES
========================= */

// ✅ QUAN TRỌNG: export ra để engine dùng
export type LoadResult =
  | { type: "question"; data: Scenario }
  | { type: "story"; data: Story; nextStage: Stage }
  | { type: "ending"; data: Ending }
  | { type: "done" }
  | { type: "error"; message: string }

