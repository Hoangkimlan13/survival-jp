import { isSoundEnabled } from "@/src/lib/settings"

let audioCtx: AudioContext | null = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume()
  }

  return audioCtx
}

/* ================= PRELOAD ================= */
export function preloadAudioContext() {
  const ctx = getCtx()
  if (ctx.state === "suspended") {
    ctx.resume()
  }
}

/* ================= CORE ================= */
function createOsc(ctx: AudioContext, type: OscillatorType, freq: number) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, ctx.currentTime)
  return o
}

function createGain(ctx: AudioContext, start = 0.001) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(start, ctx.currentTime)
  return g
}

/* ================= CORRECT (PRO) ================= */
export function playCorrect() {
  if (!isSoundEnabled()) return
  const ctx = getCtx()
  const now = ctx.currentTime

  // 🔥 attack click (rất quan trọng)
  const click = createOsc(ctx, "square", 1200)
  const clickGain = createGain(ctx)

  clickGain.gain.setValueAtTime(0.001, now)
  clickGain.gain.exponentialRampToValueAtTime(0.2, now + 0.01)
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

  click.connect(clickGain).connect(ctx.destination)

  // 🎯 main tone
  const o1 = createOsc(ctx, "triangle", 500)
  const g1 = createGain(ctx)

  o1.frequency.linearRampToValueAtTime(1000, now + 0.2)

  g1.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

  o1.connect(g1).connect(ctx.destination)

  // 🎯 harmony
  const o2 = createOsc(ctx, "sine", 800)
  const g2 = createGain(ctx)

  g2.gain.exponentialRampToValueAtTime(0.1, now + 0.03)
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

  o2.connect(g2).connect(ctx.destination)

  click.start(now)
  o1.start(now)
  o2.start(now + 0.02)

  click.stop(now + 0.05)
  o1.stop(now + 0.25)
  o2.stop(now + 0.25)
}


export function playOk() {
  if (!isSoundEnabled()) return 
  const ctx = getCtx()
  const now = ctx.currentTime

  const o = createOsc(ctx, "sine", 600)
  const g = createGain(ctx)

  g.gain.exponentialRampToValueAtTime(0.1, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

  o.connect(g).connect(ctx.destination)

  o.start(now)
  o.stop(now + 0.15)
}


export function playWrong() {

  if (!isSoundEnabled()) return

  const ctx = getCtx()
  const now = ctx.currentTime

  // 🔥 impact (cú đập)
  const hit = createOsc(ctx, "square", 200)
  const hitGain = createGain(ctx)

  hitGain.gain.setValueAtTime(0.001, now)
  hitGain.gain.exponentialRampToValueAtTime(0.3, now + 0.01)
  hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

  hit.connect(hitGain).connect(ctx.destination)

  // 🎯 fall tone
  const o = createOsc(ctx, "triangle", 400)
  const g = createGain(ctx)

  o.frequency.exponentialRampToValueAtTime(120, now + 0.25)

  g.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

  o.connect(g).connect(ctx.destination)

  hit.start(now)
  o.start(now)

  hit.stop(now + 0.08)
  o.stop(now + 0.3)
}

export function playSkip() {
  if (!isSoundEnabled()) return

  const ctx = getCtx()
  const now = ctx.currentTime

  // âm "whoosh nhẹ"
  const o = createOsc(ctx, "triangle", 300)
  const g = createGain(ctx)

  o.frequency.exponentialRampToValueAtTime(150, now + 0.15)

  g.gain.exponentialRampToValueAtTime(0.15, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

  o.connect(g).connect(ctx.destination)

  o.start(now)
  o.stop(now + 0.18)
}

export function playClick() {
  if (!isSoundEnabled()) return

  const ctx = getCtx()
  const now = ctx.currentTime

  // click nhẹ
  const click = createOsc(ctx, "square", 800)
  const g = createGain(ctx)

  g.gain.setValueAtTime(0.1, now)
  g.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

  click.connect(g).connect(ctx.destination)

  click.start(now)
  click.stop(now + 0.05)
}

function createFilter(ctx: AudioContext, type: BiquadFilterType, freq: number, q = 1) {
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(freq, ctx.currentTime)
  filter.Q.setValueAtTime(q, ctx.currentTime)
  return filter
}

function playSequence(notes: number[], wave: OscillatorType, start: number, length: number, gainValue = 0.14, filterFreq = 0, q = 1) {
  const ctx = getCtx()

  notes.forEach((freq, index) => {
    const offset = start + index * (length * 0.65)
    const o = createOsc(ctx, wave, freq)
    const g = createGain(ctx, 0.001)
    const filter = filterFreq ? createFilter(ctx, "lowpass", filterFreq, q) : null

    if (filter) {
      o.connect(filter)
      filter.connect(g)
    } else {
      o.connect(g)
    }

    g.connect(ctx.destination)
    g.gain.linearRampToValueAtTime(gainValue, offset + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, offset + length)

    o.start(offset)
    o.stop(offset + length)
  })
}

function normalizeStoryTrigger(trigger?: string) {
  const value = String(trigger || "MEDIUM").toUpperCase()
  if (value.includes("GOOD") || value.includes("COMBO")) return "good"
  if (value.includes("BAD") || value.includes("LOSE")) return "bad"
  return "medium"
}

export function playStorySound(trigger?: string) {
  if (!isSoundEnabled()) return
  const now = getCtx().currentTime
  const kind = normalizeStoryTrigger(trigger)

  if (kind === "good") {
    playSequence([440, 523, 659], "triangle", now, 0.28, 0.16, 1400, 1.2)
    playSequence([880, 988], "sine", now + 0.1, 0.28, 0.08, 1800, 0.9)
    playSequence([220], "sine", now, 0.9, 0.035, 400, 0.7)
  } else if (kind === "bad") {
    playSequence([220, 196, 174], "triangle", now, 0.34, 0.14, 900, 1.8)
    playSequence([130], "sine", now + 0.14, 0.34, 0.09, 600, 1.3)
    playSequence([280, 262], "square", now + 0.04, 0.24, 0.08, 800, 1.1)
  } else {
    playSequence([330, 392, 440], "triangle", now, 0.3, 0.145, 1200, 1.1)
    playSequence([660], "sine", now + 0.1, 0.3, 0.095, 1500, 1)
    playSequence([220], "sine", now + 0.12, 0.3, 0.05, 500, 1)
  }
}

export function playFinalSound() {
  if (!isSoundEnabled()) return
  const now = getCtx().currentTime

  // build a longer, triumphant fanfare
  playSequence([523, 659, 784, 880], "triangle", now, 0.32, 0.2, 1400, 1.1)
  playSequence([880, 988, 1047, 1175], "sine", now + 0.12, 0.36, 0.14, 1800, 0.9)
  playSequence([440, 523], "square", now + 0.08, 0.75, 0.03, 600, 0.9)
  playSequence([660, 784, 880], "triangle", now + 0.45, 0.32, 0.18, 1500, 1)

  // add a dramatic closing swell
  playSequence([988, 1175, 1318], "sine", now + 0.9, 0.42, 0.08, 1600, 1)
  playSequence([523], "triangle", now + 1.2, 0.6, 0.05, 1200, 1.1)
}

export function playEndingSound(type: string) {
  if (!isSoundEnabled()) return
  const now = getCtx().currentTime
  const normalized = String(type || "normal").toLowerCase()

  if (normalized === "good") {
    playSequence([440, 554, 659, 880], "triangle", now, 0.36, 0.18, 1500, 1.1)
    playSequence([988, 1108], "sine", now + 0.16, 0.36, 0.09, 1900, 0.88)
    playSequence([220], "square", now, 0.75, 0.04, 450, 1)
  } else if (normalized === "bad") {
    playSequence([330, 311, 294, 262], "triangle", now, 0.38, 0.15, 850, 1.6)
    playSequence([196], "sine", now + 0.16, 0.38, 0.08, 500, 1)
    playSequence([110], "sine", now + 0.1, 0.5, 0.04, 300, 1)
  } else {
    playSequence([330, 392, 440, 554], "triangle", now, 0.32, 0.16, 1100, 1.2)
    playSequence([660], "sine", now + 0.14, 0.32, 0.085, 1400, 1)
    playSequence([260], "square", now + 0.05, 0.44, 0.045, 420, 0.95)
  }
}