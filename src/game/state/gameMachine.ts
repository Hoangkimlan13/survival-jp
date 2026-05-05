type GameState =
  | "idle"
  | "loading"
  | "answering"
  | "showing_result"
  | "transitioning"

export function createGameMachine() {
  let state: GameState = "idle"

  const listeners = new Set<(s: GameState) => void>()

  const setState = (s: GameState) => {
    state = s
    listeners.forEach(l => l(state))
  }

  return {
    getState: () => state,

    setIdle: () => setState("idle"),
    setLoading: () => setState("loading"),
    setAnswering: () => setState("answering"),
    setResult: () => setState("showing_result"),
    setTransition: () => setState("transitioning"),

    subscribe: (fn: (s: GameState) => void) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    }
  }
}