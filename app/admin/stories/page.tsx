"use client"

import { useEffect, useState } from "react"
import styles from "./stories.module.css"

/* ================= TYPES ================= */
type Stage = {
  id: number
  name: string
  order: number
  isPublished: boolean
}

type Story = {
  id: number
  title?: string
  content: string
  type: string
  order: number
  trigger?: "good" | "medium" | "bad" | "win" | "lose" | ""
  weight?: number
  isDraft?: boolean   
}

/* ================= FORM TYPE ================= */
type StoryForm = {
  title: string
  content: string
  type: string
  order: number
  trigger: "" | "good" | "medium" | "bad" | "win" | "lose"
  weight: number
  isDraft: boolean
}

const normalizeTrigger = (t?: string | null): StoryForm["trigger"] => {
  if (!t) return ""

  const v = t.toLowerCase()

  if (v === "good") return "good"
  if (v === "medium") return "medium"
  if (v === "bad") return "bad"
  if (v === "win") return "win"
  if (v === "lose") return "lose"

  return ""
}


export default function StoriesPage() {

  /* ================= STATE ================= */
  const [days, setDays] = useState<any[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [stories, setStories] = useState<Story[]>([])

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [selectedStory, setSelectedStory] = useState<number | null>(null)
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all")

  const [toast, setToast] = useState<string | null>(null)

  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const filteredStories = stories.filter(s => {
    if (filter === "draft") return (s as any).isDraft
    if (filter === "published") return !(s as any).isDraft
    return true
    })

  const [form, setForm] = useState<StoryForm>({
    title: "",
    content: "",
    type: "stage",
    order: 1,
    trigger: "",
    weight: 1,
    isDraft: true
    })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
    }

  /* ================= LOAD DAYS ================= */
  useEffect(() => {
    fetch("/api/admin/days")
      .then(res => res.json())
      .then(setDays)
  }, [])

  /* ================= LOAD STAGES ================= */
  useEffect(() => {
    if (!selectedDay) return setStages([])

    fetch(`/api/admin/stages?dayId=${selectedDay}`)
      .then(res => res.json())
      .then(setStages)
  }, [selectedDay])

  /* ================= LOAD STORIES ================= */
  useEffect(() => {
    if (!selectedStage) return setStories([])

    fetch(`/api/admin/stories?stageId=${selectedStage}`)
      .then(res => res.json())
      .then(setStories)
  }, [selectedStage])

  /* ================= SELECT ================= */
  const selectDay = (id: number) => {
    setSelectedDay(id)
    setSelectedStage(null)
    setSelectedStory(null)
    setStories([])
  }

  const selectStage = (stage: Stage) => {
    setSelectedStage(stage.id)
    setSelectedStory(null)

    setForm({
    title: "",
    content: "",
    type: "stage",
    order: 1,
    trigger: "",
    weight: 1,
    isDraft: true
    })
  }

  const selectStory = (story: Story) => {
    setIsEditorOpen(true)
    setSelectedStory(story.id)

    setForm({
    title: story.title || "",
    content: story.content,
    type: story.type,
    order: story.order,
    trigger: normalizeTrigger(story.trigger),
    weight: story.weight || 1,
    isDraft: (story as any).isDraft ?? true  
    })
  }

  /* ================= RANDOM ================= */
  const randomPreview = () => {
    if (!stories.length) return

    const random = stories[Math.floor(Math.random() * stories.length)]

    setSelectedStory(random.id)
    setForm({
    title: random.title || "",
    content: random.content,
    type: random.type,
    order: random.order,
    trigger: (random.trigger?.toLowerCase() as StoryForm["trigger"]) || "",
    weight: random.weight || 1,
    isDraft: true
    })

    setIsEditorOpen(true)
  }

  /* ================= SAVE ================= */
  const saveStory = async () => {
    if (!selectedStage) return

    const isUpdate = !!selectedStory

    const res = await fetch(
        isUpdate
        ? `/api/admin/stories/${selectedStory}`
        : "/api/admin/stories",
        {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...form,
            stageId: selectedStage,
            trigger: form.trigger || undefined,

            isDraft: form.isDraft
        })
        }
    )

    if (!res.ok) {
        showToast("❌ Lỗi lưu story")
        return
    }

    const data = await res.json()

    if (isUpdate) {
        setStories(prev =>
        prev.map(s => (s.id === selectedStory ? data : s))
        )
        showToast("Đã cập nhật story (Draft)")
    } else {
        setStories(prev => [...prev, data])
        showToast("Đã tạo story (Draft)")
    }

    setIsEditorOpen(false)
    setSelectedStory(null)
    }

  /* ================= DELETE ================= */
  const deleteStory = async () => {
    if (!selectedStory) return
    if (!confirm("Xoá story này?")) return

    const res = await fetch(`/api/admin/stories/${selectedStory}`, {
        method: "DELETE"
    })

    if (!res.ok) {
        showToast("❌ Xoá thất bại")
        return
    }

    setStories(prev => prev.filter(s => s.id !== selectedStory))
    setSelectedStory(null)
    setIsEditorOpen(false)

    showToast("Đã xoá story")
    }


  /* ================= UI ================= */

  const groupedStories = stories.reduce((acc: Record<string, Story[]>, story) => {
  const key = (story.trigger || "none").toLowerCase()

    if (!acc[key]) acc[key] = []
    acc[key].push(story)

    return acc
    }, {})

    const triggerLabel: Record<string, string> = {
    good: "🟢 Tốt",
    medium: "🟡 Trung bình",
    bad: "🔴 Xấu",
    win: "🏆 Chiến thắng",
    lose: "💀 Thất bại",
    none: "⚪ Không có"
    }

  return (
    <div className={styles.wrapper}>

    {toast && (
    <div className={styles.toast}>
        {toast}
    </div>
    )}

      {/* DAY */}
      <div className={styles.col}>
        <h3>📅 Day</h3>
        {days.map(day => (
          <div
            key={day.id}
            className={`${styles.item} ${selectedDay === day.id ? styles.active : ""}`}
            onClick={() => selectDay(day.id)}
          >
            Day {day.order} - {day.name}
          </div>
        ))}
      </div>

      {/* STAGE */}
      <div className={styles.col}>
        <h3>🎯 Stage</h3>

        {!selectedDay && <p>👉 Chọn Day trước</p>}

        {stages.map(stage => (
          <div
            key={stage.id}
            className={`${styles.item} ${selectedStage === stage.id ? styles.active : ""}`}
            onClick={() => selectStage(stage)}
          >
            {stage.order}. {stage.name}
          </div>
        ))}
      </div>

      {/* STORY */}
      <div className={styles.col}>
        <div className={styles.headerRow}>

        <h3 className={styles.titleH3}>📖 Story</h3>

        <div className={styles.headerActions}>
            <button
            className={styles.addBtn}
            onClick={() => {
                setIsEditorOpen(true)
                setSelectedStory(null)
                setForm({
                title: "",
                content: "",
                type: "stage",
                order: stories.length + 1,
                trigger: "",
                weight: 1,
                isDraft: true
                })
            }}
            >
            + Thêm Story
            </button>
        </div>

        </div>

        {selectedStage && stories.length === 0 && (
          <p>Chưa có story</p>
        )}

        {Object.entries(groupedStories).map(([trigger, list]) => (
        <div key={trigger} className={styles.groupBox}>

            {/* HEADER GROUP */}
            <div className={styles.groupTitle}>
            {triggerLabel[trigger.toLowerCase()] || trigger}
            <span className={styles.groupCount}>
                {list.length}
            </span>
            </div>

            {/* ITEMS */}
            {list.map(story => (
            <div
                key={story.id}
                className={`${styles.item} ${selectedStory === story.id ? styles.active : ""}`}
                onClick={() => selectStory(story)}
            >
                <div>
                <b>{story.title || "No title"}</b>

                <p className={styles.storyPreview}>
                    {story.content.slice(0, 60)}...
                </p>

                <div className={styles.storyMeta}>
                    {(story as any).isDraft ? (
                    <span className={`${styles.statusTag} ${styles.draft}`}>
                        🟡 Nháp
                    </span>
                    ) : (
                    <span className={`${styles.statusTag} ${styles.published}`}>
                        🟢 Công khai
                    </span>
                    )}
                </div>
                </div>
            </div>
            ))}

        </div>
        ))}
      </div>

      {/* ================= EDITOR ================= */}
        {isEditorOpen && (
        <div className={styles.editor}>

            <h3>✏️ Trình chỉnh sửa Story</h3>

            {/* TIÊU ĐỀ */}
            <input
            placeholder="Nhập tiêu đề story..."
            value={form.title}
            onChange={e =>
                setForm({ ...form, title: e.target.value })
            }
            />

            {/* NỘI DUNG */}
            <textarea
            placeholder="Nhập nội dung story..."
            value={form.content}
            onChange={e =>
                setForm({ ...form, content: e.target.value })
            }
            />

            {/* TRIGGER */}
            <label>🎯 Điều kiện kích hoạt (Trigger)</label>
            <select
            value={form.trigger}
            onChange={e =>
                setForm({
                ...form,
                trigger: e.target.value as "" | "good" | "medium" | "bad" | "win" | "lose"
                })
            }
            >
            <option value="">-- Chọn trigger --</option>
            <option value="good">Tốt (Good)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="bad">Xấu (Bad)</option>
            <option value="win">Chiến thắng (Win)</option>
            <option value="lose">Thất bại (Lose)</option>
            </select>

            {/* TRỌNG SỐ */}
            <label>🎲 Tỉ lệ xuất hiện (Weight)</label>
            <input
            type="number"
            min={1}
            value={form.weight}
            onChange={e =>
                setForm({ ...form, weight: Number(e.target.value) })
            }
            />

            {/* ================= STATUS ================= */}
            <label>📢 Trạng thái</label>

            <div className={styles.toggleRow}>
            <label>
                <input
                type="radio"
                checked={form.isDraft === true}
                onChange={() => setForm({ ...form, isDraft: true })}
                />
                🟡 Nháp
            </label>

            <label>
                <input
                type="radio"
                checked={form.isDraft === false}
                onChange={() => setForm({ ...form, isDraft: false })}
                />
                🟢 Công khai
            </label>
            </div>


           <div className={styles.actions}>

            {/* NÚT LƯU / TẠO */}
            <button
                className={selectedStory ? styles.btnUpdate : styles.btnAdd}
                onClick={saveStory}
            >
                {selectedStory ? "Cập nhật Story" : "Tạo Story"}
            </button>

            {/* NÚT XOÁ */}
            {selectedStory && (
                <button
                className={styles.btnDelete}
                onClick={deleteStory}
                >
                Xoá Story
                </button>
            )}

            </div>

        </div>
        )}
    </div>
  )
}