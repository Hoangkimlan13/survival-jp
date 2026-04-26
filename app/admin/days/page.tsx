"use client"

import { useEffect, useState } from "react"
import styles from "./days.module.css"

type Day = {
  id: number
  name: string
  description: string
  order: number
  isPublished: boolean

  stageCount: number   
  questionCount: number
}



export default function DaysPage() {
  const [days, setDays] = useState<Day[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null)

    const [form, setForm] = useState({
    name: "",
    description: "",
    order: 1,
    isPublished: false
    })

    type Stage = {
    id: number
    name: string
    order: number

    isPublished: boolean
    questionCount: number
    }
    
    type Question = {
    id: number
    question: string
    translation?: string
    isPublished: boolean
    choices?: Choice[]
    }

    const [stageForm, setStageForm] = useState({
    name: "",
    order: 1,
    isPublished: false
    })

    type ChoiceQuality = "PERFECT" | "GOOD" | "OK" | "BAD"

    type Choice = {
    id?: number
    text: string
    translation: string
    feedback: string
    isCorrect?: boolean
    quality: ChoiceQuality
    }

    type QuestionForm = {
    question: string
    translation: string
    isPublished: boolean
    choices: Choice[]
    }

    const [questionForm, setQuestionForm] = useState<QuestionForm>({
    question: "",
    translation: "",
    isPublished: false,
    choices: []
    })

  // ================= LOAD DAYS =================
  useEffect(() => {
    fetch("/api/admin/days")
        .then(res => res.json())
        .then(data => {
        console.log("DAYS API:", data)

        // FIX CHÍNH
        if (Array.isArray(data)) {
            setDays(data)
        } else if (Array.isArray(data.days)) {
            setDays(data.days)
        } else {
            setDays([])
        }
        })
    }, [])

  // ================= LOAD STAGES =================
  useEffect(() => {
    if (!selectedDay) return

    const day = days.find(d => d.id === selectedDay)
    if (day) {
        setForm({
        name: day.name,
        description: day.description,
        order: day.order,
        isPublished: day.isPublished ?? false
        })
    }
    }, [selectedDay])

    // ================= LOAD STAGES =================
    useEffect(() => {
    if (!selectedDay) {
        setStages([])
        return
    }

    fetch(`/api/admin/stages?dayId=${selectedDay}`)
        .then(res => res.json())
        .then(setStages)
    }, [selectedDay])


  // ================= LOAD QUESTIONS =================
  useEffect(() => {
    if (!selectedStage) {
      setQuestions([])
      return
    }

    fetch(`/api/admin/questions?stageId=${selectedStage}`)
      .then(res => res.json())
      .then(setQuestions)
  }, [selectedStage])

  // ================= CREATE DAY =================
  type Mode =
    | "createDay"
    | "editDay"
    | "createStage"
    | "editStage"
    | "createQuestion"
    | "editQuestion"

    const [mode, setMode] = useState<Mode>("createDay")
  
  const createDay = () => {
    setMode("createDay")
    setSelectedDay(null)
    setSelectedStage(null)

    setForm({
    name: "",
    description: "",
    order: days.length + 1,
    isPublished: false
    })
    }

    const handleSaveNew = async () => {
    if (!form.name.trim()) {
        alert("Nhập tên trước")
        return
    }

    const res = await fetch("/api/admin/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
    })

    const newDay = await res.json()

    setDays(prev => [...prev, newDay])
    setSelectedDay(newDay.id)
    }

  // ================= UPDATE DAY =================
  const updateDay = async () => {
    if (!selectedDay) return

    const res = await fetch(`/api/admin/days/${selectedDay}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    const updated = await res.json()

    setDays(prev =>
      prev.map(d => (d.id === selectedDay ? updated : d))
    )
  }

  // ================= DELETE DAY =================
  const deleteDay = async () => {
    if (!selectedDay) return
    if (!confirm("Xóa Day này?")) return

    await fetch(`/api/admin/days/${selectedDay}`, {
      method: "DELETE"
    })

    setDays(prev => prev.filter(d => d.id !== selectedDay))
    setSelectedDay(null)
    setStages([])
    setQuestions([])
  }



  // ================= CREATE STAGE =================
  const createStage = () => {
    if (!selectedDay) return

    setMode("createStage")
    setSelectedStage(null)

    setStageForm({
    name: "",
    order: stages.length + 1,
    isPublished: false
    })
    }


    const handleCreateStage = async () => {
    if (!selectedDay || !stageForm.name.trim()) {
        alert("Nhập tên stage")
        return
    }

    const res = await fetch("/api/admin/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
        ...stageForm,
        dayId: selectedDay,
        minQuestions: 5,
        maxQuestions: 10
        })
    })

    if (!res.ok) {
        const text = await res.text()
        console.error("API ERROR:", text)
        alert("Create failed")
        return
    }

    const newStage = await res.json()

    setStages(prev => [...prev, newStage])
    setSelectedStage(newStage.id)
    setMode("editStage")
    }

    const updateStage = async () => {
    if (!selectedStage) return

    const res = await fetch(`/api/admin/stages/${selectedStage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stageForm)
    })

    const updated = await res.json()

    setStages(prev =>
        prev.map(s => (s.id === selectedStage ? updated : s))
    )
    }

    // ================= DELETE STAGE =================
    const deleteStage = async () => {
    if (!selectedStage) return
    if (!confirm("Xóa Stage này?")) return

    const res = await fetch(`/api/admin/stages/${selectedStage}`, {
        method: "DELETE"
    })

    if (!res.ok) {
        alert("Delete failed")
        return
    }

    // cập nhật UI
    setStages(prev => prev.filter(s => s.id !== selectedStage))
    setSelectedStage(null)
    setMode("createStage")
    }

    useEffect(() => {
    if (!selectedStage) return

    const stage = stages.find(s => s.id === selectedStage)
    if (stage) {
        setStageForm({
        name: stage.name,
        order: stage.order || 1,
        isPublished: stage.isPublished ?? false
        })
    }
    },[selectedStage, stages])

  // ================= CREATE QUESTION =================
    const createQuestion = () => {
        if (!selectedStage) return

        setMode("createQuestion")
        setSelectedQuestion(null)

        setQuestionForm({
            question: "",
            translation: "",
            isPublished: false,
            choices: []
        })
        }

        
        const updateQuestion = async () => {
        if (!selectedQuestion) return

        const res = await fetch(`/api/admin/questions/${selectedQuestion}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionForm)
        })

        if (!res.ok) {
        const text = await res.text()
        console.error("API ERROR:", text)
        alert("❌ Sửa thất bại")
        return
        }

        alert("✅ Sửa thành công")

        const updated = await res.json()

        setQuestions(prev =>
            prev.map(q => (q.id === selectedQuestion ? updated : q))
        )
    }


    const handleCreateQuestion = async () => {
        
    if (!selectedStage || !questionForm.question.trim()) {
        alert("Nhập câu hỏi")
        return
    }

    const res = await fetch("/api/admin/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
    question: questionForm.question,
    translation: questionForm.translation,
    stageId: selectedStage,
    choices: questionForm.choices
    })
    })

    if (!res.ok) {
    const text = await res.text()
    console.error("UPDATE ERROR:", text)
    alert("❌ Thêm thất bại")
    return
    }

    alert("✅ Thêm thành công")

    const newQ = await res.json()

    setQuestions(prev => [...prev, newQ])
    setSelectedQuestion(newQ.id)
    setMode("editQuestion")

    // reset form
    setQuestionForm({
    question: "",
    translation: "",
    isPublished: false, 
    choices: [
        {
        text: "",
        translation: "",
        feedback: "",
        isCorrect: false,
        quality: "OK"
        }
    ]
    })
    }


    const deleteQuestion = async () => {
    if (!selectedQuestion) return
    if (!confirm("Xóa câu hỏi này?")) return

    const res = await fetch(`/api/admin/questions/${selectedQuestion}`, {
        method: "DELETE"
    })

    if (!res.ok) {
    alert("❌ Xóa thất bại")
    return
    }

    alert("✅ Đã xóa")

    setQuestions(prev => prev.filter(q => q.id !== selectedQuestion))
    setSelectedQuestion(null)
    setMode("createQuestion")
    }


    useEffect(() => {
    if (!selectedQuestion) return

    const q = questions.find(q => q.id === selectedQuestion)
    if (q) {
        setQuestionForm({
        question: q.question,
        translation: q.translation || "",
        isPublished: q.isPublished ?? false,
        choices: q.choices || []
        })
    }
    }, [selectedQuestion, questions])


  const currentDay = days.find(d => d.id === selectedDay)

  return (
    <div className={styles.wrapper}>

      {/* ===== DAYS ===== */}
      <div className={styles.col}>
        <div className={styles.header}>
          <h3>Danh sách Days</h3>
          <button onClick={createDay}>+ Day</button>
        </div>

        {days.length === 0 && <p>Không có day nào</p>}

        <div className={styles.scrollArea}>
        {days.map(day => (
          <div
            key={day.id}
            className={`${styles.item} ${selectedDay === day.id ? styles.active : ""}`}
            onClick={() => {
            setSelectedDay(day.id)
            setSelectedStage(null)
            setMode("editDay")
            }}
          >
            <div className={styles.itemRow}>
            <span className={styles.title}>
                Day {day.order} - {day.name}
            </span>

            <div className={styles.meta}>
                <span className={styles.badge}>
                {day.stageCount} Stage
                </span>

                <span className={`${styles.status} ${day.isPublished ? styles.public : styles.draft}`}>
                {day.isPublished ? "Công khai" : "Nháp"}
                </span>
            </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* ===== STAGES ===== */}
      <div className={styles.col}>
        <div className={styles.header}>
          <h3>Stages của (Day {currentDay?.order || "-"})</h3>
          <button onClick={createStage}>+ Stage</button>
        </div>

        {!selectedDay && <p>Chọn Day trước</p>}
        {selectedDay && stages.length === 0 && <p>Không có stage nào</p>}

        <div className={styles.scrollArea}>
        {stages.map(stage => (
          <div
            key={stage.id}
            className={`${styles.item} ${selectedStage === stage.id ? styles.active : ""}`}
            onClick={() => {
            setSelectedStage(stage.id)
            setMode("editStage")
            }}
          >
            <div className={styles.itemRow}>
            <span className={styles.title}>
                {stage.order}. {stage.name}
            </span>

            <div className={styles.meta}>
                <span className={styles.badge}>
                {stage.questionCount} câu
                </span>

                <span className={`${styles.status} ${stage.isPublished ? styles.public : styles.draft}`}>
                {stage.isPublished ? "Công khai" : "Nháp"}
                </span>
            </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* ===== QUESTIONS ===== */}
      <div className={styles.col}>
        <div className={styles.header}>
          <h3>câu hỏi - Stage </h3>
          <button onClick={createQuestion}>+ Thêm câu hỏi</button>
        </div>

        {!selectedStage && <p>Chọn Stage trước</p>}
        {selectedStage && questions.length === 0 && <p>Không có câu hỏi nào</p>}

        <div className={styles.scrollArea}>
        {questions.map(q => (
          <div
            key={q.id}
            className={`${styles.item} ${selectedQuestion === q.id ? styles.active : ""}`}
            onClick={() => {
            setSelectedQuestion(q.id)
            setMode("editQuestion")
            }}
          >
            {q.question}
            <span className={`${styles.status} ${q.isPublished ? styles.public : styles.draft}`}>
                {q.isPublished ? "Công khai" : "Nháp"}
            </span>
          </div>
        ))}
        </div>
      </div>

      {/* ===== EDITOR ===== */}
      <div className={styles.editor}>
        <div className={styles.scrollArea}>
        <h3>Chi tiết</h3>

        {/* ===== CREATE DAY ===== */}
        {mode === "createDay" && (
            <div className={styles.form}>
            <h4>Tạo Day mới</h4>

            <input
                className={styles.input}
                placeholder="Tên"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <textarea
                className={styles.textarea}
                placeholder="Mô tả"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <input
                className={styles.input}
                type="number"
                value={form.order}
                onChange={e => setForm({ ...form, order: Number(e.target.value) })}
            />

            <label className={styles.switch}>
            <input
            type="checkbox"
            checked={form.isPublished}
            onChange={async (e) => {
                const newValue = e.target.checked

                // update UI ngay
                setForm(prev => ({
                ...prev,
                isPublished: newValue
                }))

                // call API update
                if (selectedDay) {
                await fetch(`/api/admin/days/${selectedDay}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    ...form,
                    isPublished: newValue
                    })
                })

                // update list bên trái luôn
                setDays(prev =>
                    prev.map(d =>
                    d.id === selectedDay
                        ? { ...d, isPublished: newValue }
                        : d
                    )
                )
                }
            }}
            />
            <span>Công khai Day</span>
            </label>

            <div className={styles.formActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSaveNew}>
                Thêm Day
                </button>
            </div>
            </div>
        )}

        {/* ===== EDIT DAY ===== */}
        {mode === "editDay" && selectedDay && (
            <div className={styles.form}>
            <h4>Sửa Day {currentDay?.order}</h4>

            <input
                className={styles.input}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <textarea
                className={styles.textarea}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <input
                className={styles.input}
                type="number"
                value={form.order}
                onChange={e => setForm({ ...form, order: Number(e.target.value) })}
            />

            <label className={styles.switch}>
            <input
            type="checkbox"
            checked={form.isPublished}
            onChange={async (e) => {
                const newValue = e.target.checked

                // update UI ngay
                setForm(prev => ({
                ...prev,
                isPublished: newValue
                }))

                // call API update
                if (selectedDay) {
                await fetch(`/api/admin/days/${selectedDay}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    ...form,
                    isPublished: newValue
                    })
                })

                // update list bên trái luôn
                setDays(prev =>
                    prev.map(d =>
                    d.id === selectedDay
                        ? { ...d, isPublished: newValue }
                        : d
                    )
                )
                }
            }}
            />
            <span>Công khai Day</span>
            </label>

            <div className={styles.formActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={updateDay}>
                Sửa
                </button>

                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteDay}>
                Xóa
                </button>
            </div>
            </div>
        )}

        {/* ===== CREATE STAGE ===== */}
        {mode === "createStage" && selectedDay && (
            <div className={styles.form}>
            <h4>Tạo Stage (Day {currentDay?.order})</h4>

            <input
                className={styles.input}
                placeholder="Tên stage"
                value={stageForm.name}
                onChange={e => setStageForm({ ...stageForm, name: e.target.value })}
            />

            <input
                className={styles.input}
                type="number"
                value={stageForm.order}
                onChange={e => setStageForm({ ...stageForm, order: Number(e.target.value) })}
            />

            <label className={styles.switch}>
            <input
            type="checkbox"
            checked={stageForm.isPublished}
            onChange={async (e) => {
            const newValue = e.target.checked

            setStageForm(prev => ({
                ...prev,
                isPublished: newValue
            }))

            if (selectedStage) {
                await fetch(`/api/admin/stages/${selectedStage}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...stageForm,
                    isPublished: newValue
                })
                })

                setStages(prev =>
                prev.map(s =>
                    s.id === selectedStage
                    ? { ...s, isPublished: newValue }
                    : s
                )
                )
            }
            }}
            />
            <span>Công khai Stage</span>
            </label>

            <div className={styles.formActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCreateStage}>
                Thêm Stage
                </button>
            </div>
            </div>
        )}

        {/* ===== EDIT STAGE ===== */}
        {mode === "editStage" && selectedStage && (
            <div className={styles.form}>
            <h4>Sửa Stage</h4>

            <input
                className={styles.input}
                value={stageForm.name}
                onChange={e => setStageForm({ ...stageForm, name: e.target.value })}
            />

            <input
                className={styles.input}
                type="number"
                value={stageForm.order}
                onChange={e => setStageForm({ ...stageForm, order: Number(e.target.value) })}
            />

            <label className={styles.switch}>
            <input
            type="checkbox"
            checked={stageForm.isPublished}
            onChange={async (e) => {
            const newValue = e.target.checked

            setStageForm(prev => ({
                ...prev,
                isPublished: newValue
            }))

            if (selectedStage) {
                await fetch(`/api/admin/stages/${selectedStage}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...stageForm,
                    isPublished: newValue
                })
                })

                setStages(prev =>
                prev.map(s =>
                    s.id === selectedStage
                    ? { ...s, isPublished: newValue }
                    : s
                )
                )
            }
            }}
            />
            <span>Công khai Stage</span>
            </label>

            <div className={styles.formActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={updateStage}>
                Sửa
                </button>

                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteStage}>
                Xóa
                </button>
            </div>
            </div>
        )}


        {/* ===== Câu hỏi ===== */}
        {/* ===== CREATE QUESTION ===== */}
        {mode === "createQuestion" && selectedStage && (
        <div className={styles.form}>
            <h4>Tạo câu hỏi</h4>

            {/* Câu hỏi */}
            <textarea
            className={styles.textarea}
            placeholder="Nhập câu hỏi"
            value={questionForm.question}
            onChange={(e) =>
                setQuestionForm({
                ...questionForm,
                question: e.target.value
                })
            }
            />

            {/* Dịch */}
            <textarea
            className={styles.textarea}
            placeholder="Dịch nghĩa"
            value={questionForm.translation}
            onChange={(e) =>
                setQuestionForm({
                ...questionForm,
                translation: e.target.value
                })
            }
            />

            {/* Publish */}
            <label className={styles.switch}>
            <input
            type="checkbox"
            checked={questionForm.isPublished}
            onChange={async (e) => {
                const newValue = e.target.checked

                setQuestionForm(prev => ({
                ...prev,
                isPublished: newValue
                }))

                if (selectedQuestion) {
                await fetch(`/api/admin/questions/${selectedQuestion}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    ...questionForm,
                    isPublished: newValue
                    })
                })

                setQuestions(prev =>
                    prev.map(q =>
                    q.id === selectedQuestion
                        ? { ...q, isPublished: newValue }
                        : q
                    )
                )
                }
            }}
            />
            <span>Công khai câu hỏi</span>
            </label>

            {/* CHOICES */}
            <h5>Các cách trả lời</h5>

            {questionForm.choices.map((c, index) => (
            <div key={c.id || index} className={styles.choiceBox}>

                <input
                className={styles.input}
                placeholder="Nội dung trả lời"
                value={c.text}
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].text = e.target.value
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                />

                <input
                className={styles.input}
                placeholder="Dịch nghĩa"
                value={c.translation}
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].translation = e.target.value
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                />

                <input
                className={styles.input}
                placeholder="Giải thích (feedback)"
                value={c.feedback}
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].feedback = e.target.value
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                />

                <select
                className={`${styles.choiceSelect} ${styles[c.quality]}`}
                value={c.quality}
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].quality = e.target.value as ChoiceQuality
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                >
                <option value="PERFECT">Hoàn hảo</option>
                <option value="GOOD">Tốt</option>
                <option value="OK">Ổn</option>
                <option value="BAD">Sai</option>
                </select>

                {/* DELETE */}
                <button
                type="button"
                onClick={() =>
                    setQuestionForm({
                    ...questionForm,
                    choices: questionForm.choices.filter((_, i) => i !== index)
                    })
                }
                >
                ❌ Xóa
                </button>

            </div>
            ))}

            {/* ADD */}
            <button
            type="button"
            className={styles.addChoiceBtn}
            onClick={() =>
                setQuestionForm({
                ...questionForm,
                choices: [
                    ...questionForm.choices,
                    { 
                    text: "", 
                    translation: "", 
                    feedback: "", 
                    isCorrect: false,
                    quality: "OK"
                    }
                ]
                })
            }
            >
            Thêm cách trả lời
            </button>

            <div className={styles.formActions}>
            <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleCreateQuestion}
            >
                Thêm câu hỏi
            </button>
            </div>
        </div>
        )}
        

        {/* ===== EDIT QUESTION ===== */}
        {mode === "editQuestion" && selectedQuestion && (
        <div className={styles.form}>
            <h4>Edit Question</h4>

            <textarea
            className={styles.textarea}
            value={questionForm.question}
            onChange={(e) =>
                setQuestionForm({
                ...questionForm,
                question: e.target.value
                })
            }
            />

            <textarea
            className={styles.textarea}
            value={questionForm.translation}
            onChange={(e) =>
                setQuestionForm({
                ...questionForm,
                translation: e.target.value
                })
            }
            />

            {/* Publish */}
            <label className={styles.switch}>
            <input
            type="checkbox"
            checked={questionForm.isPublished}
            onChange={async (e) => {
                const newValue = e.target.checked

                setQuestionForm(prev => ({
                ...prev,
                isPublished: newValue
                }))

                if (selectedQuestion) {
                await fetch(`/api/admin/questions/${selectedQuestion}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    ...questionForm,
                    isPublished: newValue
                    })
                })

                setQuestions(prev =>
                    prev.map(q =>
                    q.id === selectedQuestion
                        ? { ...q, isPublished: newValue }
                        : q
                    )
                )
                }
            }}
            />
            <span>Công khai câu hỏi</span>
            </label>

            {/* CHOICES */}
            <h5>Các cách trả lời</h5>

            {questionForm.choices.map((c, index) => (
            <div key={c.id || index} className={styles.choiceBox}>

                <input
                value={c.text}
                placeholder="Nội dung trả lời"
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].text = e.target.value
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                />

                <input
                value={c.translation}
                placeholder="Dịch nghĩa"
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].translation = e.target.value
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                />

                <input
                value={c.feedback}
                placeholder="Giải thích"
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].feedback = e.target.value
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                />

                <select
                className={`${styles.choiceSelect} ${styles[c.quality]}`}
                value={c.quality}
                onChange={(e) => {
                    const newChoices = [...questionForm.choices]
                    newChoices[index].quality = e.target.value as ChoiceQuality
                    setQuestionForm({ ...questionForm, choices: newChoices })
                }}
                >
                <option value="PERFECT">Hoàn hảo</option>
                <option value="GOOD">Tốt</option>
                <option value="OK">Ổn</option>
                <option value="BAD">Sai</option>
                </select>

                {/* DELETE */}
                <button
                type="button"
                onClick={() =>
                setQuestionForm(prev => ({
                    ...prev,
                    choices: prev.choices.filter((_, i) => i !== index)
                }))
                }
                >
                Xóa
                </button>

            </div>
            ))}

            {/* ADD */}
           <button
            type="button"
            className={styles.addChoiceBtn}  
            onClick={() =>
                setQuestionForm({
                ...questionForm,
                choices: [
                    ...questionForm.choices,
                    {
                    text: "",
                    translation: "",
                    feedback: "",
                    isCorrect: false,
                    quality: "OK"
                    }
                ]
                })
            }
            >
            Thêm cách trả lời
            </button>

            <div className={styles.formActions}>
            <button className={styles.btnPrimary} onClick={updateQuestion}>
                Sửa
            </button>

            <button
            className={styles.btnDanger}
            onClick={() => {
                if (!confirm("Bạn có chắc muốn xóa câu hỏi này không?")) return
                deleteQuestion()
            }}
            >
            Xóa
            </button>
            </div>
        </div>
        )}

        </div>

      </div>
    </div>
  )
}