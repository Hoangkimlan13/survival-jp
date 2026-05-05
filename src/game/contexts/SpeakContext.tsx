import { createContext, useContext, useRef, ReactNode, useState } from "react"

interface SpeakContextType {
  activeId: string | null
  setActive: (id: string | null) => void
  stopOthers: (currentId: string) => void
}

const SpeakContext = createContext<SpeakContextType | undefined>(undefined)

export function SpeakProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const setActive = (id: string | null) => {
    setActiveId(id)
  }

  const stopOthers = (currentId: string) => {
    if (activeId && activeId !== currentId) {
      const event = new CustomEvent("speakStop", {
        detail: { id: activeId }
      })
      window.dispatchEvent(event)
    }
    setActiveId(currentId)
  }

  return (
    <SpeakContext.Provider value={{ activeId, setActive, stopOthers }}>
      {children}
    </SpeakContext.Provider>
  )
}

export function useSpeakContext() {
  const ctx = useContext(SpeakContext)
  if (!ctx) {
    throw new Error("useSpeakContext must be used within SpeakProvider")
  }
  return ctx
}
