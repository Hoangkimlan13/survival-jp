"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreatePage() {
  const router = useRouter()

  const [form, setForm] = useState({
    question: "",
    translation: "",
    levelId: 1,
    stageId: 1
  })

  const [choices, setChoices] = useState([
    { text: "", correct: true, feedback: "" }
  ])

  const addChoice = () => {
    setChoices([...choices, { text: "", correct: false, feedback: "" }])
  }

  const submit = async () => {
    await fetch("/api/admin/question", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        choices
      })
    })

    router.push("/admin")
  }

  return (
    <div className="form">
      <h1>Tạo câu hỏi</h1>

      <input
        placeholder="Question"
        onChange={e => setForm({ ...form, question: e.target.value })}
      />

      <input
        placeholder="Translation"
        onChange={e => setForm({ ...form, translation: e.target.value })}
      />

      <input
        type="number"
        placeholder="Level"
        onChange={e => setForm({ ...form, levelId: +e.target.value })}
      />

      <input
        type="number"
        placeholder="Stage"
        onChange={e => setForm({ ...form, stageId: +e.target.value })}
      />

      <h3>Choices</h3>

      {choices.map((c, i) => (
        <div key={i}>
          <input
            placeholder="Text"
            onChange={e => {
              const copy = [...choices]
              copy[i].text = e.target.value
              setChoices(copy)
            }}
          />

          <input
            placeholder="Feedback"
            onChange={e => {
              const copy = [...choices]
              copy[i].feedback = e.target.value
              setChoices(copy)
            }}
          />

          <input
            type="checkbox"
            onChange={e => {
              const copy = [...choices]
              copy[i].correct = e.target.checked
              setChoices(copy)
            }}
          /> Correct
        </div>
      ))}

      <button onClick={addChoice}>+ Add choice</button>

      <button onClick={submit}>SAVE</button>
    </div>
  )
}