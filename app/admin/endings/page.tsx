"use client"

import { useEffect, useState } from "react"
import styles from "./endings.module.css"

/* ================= TYPES ================= */
type Day = {
  id: number
  name: string
  order: number
}

type EndingType = "good" | "medium" | "bad" | "win" | "lose" | ""

type Ending = {
  id: number
  title: string
  message: string
  type: EndingType
  image?: string        
  isDraft?: boolean
  dayId: number
}

type EndingForm = {
  title: string
  message: string
  type: EndingType
  isDraft: boolean
  image?: string        
}

/* ================= LABEL ================= */
const endingLabel: Record<string, string> = {
  good: "🟢 Tốt Ending",
  medium: "🟡 Trung bình Ending",
  bad: "🔴 Xấu Ending",
  win: "🏆 Win Ending",
  lose: "💀 Lose Ending",
  "": "⚪ Không có"
}

/* ================= NORMALIZE ================= */
const normalizeType = (t?: string | null): EndingType => {
  if (!t) return ""
  return t.toLowerCase() as EndingType
}

export default function EndingsPage() {
  /* ================= STATE ================= */
  const [days, setDays] = useState<Day[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [endings, setEndings] = useState<Ending[]>([])
  const [selectedEnding, setSelectedEnding] = useState<number | null>(null)

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [form, setForm] = useState<EndingForm>({
    title: "",
    message: "",
    type: "",
    isDraft: true
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  /* ================= LOAD DAYS ================= */
  useEffect(() => {
    fetch("/api/admin/days")
        .then(r => r.json())
        .then(data => {
        console.log("DAYS:", data)

        
        setDays(Array.isArray(data) ? data : data.data || data.days || [])
        })
    }, [])

  /* ================= LOAD ENDINGS ================= */
  useEffect(() => {
    if (!selectedDay) return setEndings([])

    fetch(`/api/admin/endings?dayId=${selectedDay}`)
      .then(r => r.json())
      .then(setEndings)
  }, [selectedDay])

  /* ================= GROUP ================= */
  const grouped = endings.reduce((acc: Record<string, Ending[]>, item) => {
    const key = item.type || ""
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  /* ================= SELECT ================= */
  const selectEnding = (e: Ending) => {
    setSelectedEnding(e.id)
    setIsEditorOpen(true)

    setForm({
    title: e.title,
    message: e.message,
    type: normalizeType(e.type),
    isDraft: e.isDraft ?? true,
    image: e.image || "" 
    })
  }

  /* ================= SAVE ================= */
  const saveEnding = async () => {
    if (!selectedDay) return

    const isUpdate = !!selectedEnding

    const res = await fetch(
      isUpdate
        ? `/api/admin/endings/${selectedEnding}`
        : "/api/admin/endings",
      {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dayId: selectedDay,
          type: form.type || undefined,
          image: form.image || null
        })
      }
    )

    if (!res.ok) {
      showToast("❌ Lỗi lưu ending")
      return
    }

    const data = await res.json()

    if (isUpdate) {
      setEndings(prev =>
        prev.map(e => (e.id === selectedEnding ? data : e))
      )
      showToast("Đã cập nhật ending")
    } else {
      setEndings(prev => [...prev, data])
      showToast("Đã tạo ending")
    }

    setIsEditorOpen(false)
    setSelectedEnding(null)
  }

  /* ================= DELETE ================= */
  const deleteEnding = async () => {
    if (!selectedEnding) return
    if (!confirm("Xoá ending này?")) return

    await fetch(`/api/admin/endings/${selectedEnding}`, {
      method: "DELETE"
    })

    setEndings(prev => prev.filter(e => e.id !== selectedEnding))
    setSelectedEnding(null)
    setIsEditorOpen(false)

    showToast("Đã xoá ending")
  }

  /* ================= UI ================= */
  return (
    <div className={styles.wrapper}>

      {toast && <div className={styles.toast}>{toast}</div>}

      {/* DAY */}
      <div className={styles.col}>
        <div className={styles.headerRow}>
        <h3 className={styles.title}>📅 Day</h3>
        </div>
        {days.map(day => (
          <div
            key={day.id}
            className={`${styles.item} ${selectedDay === day.id ? styles.active : ""}`}
            onClick={() => setSelectedDay(day.id)}
          >
            Day {day.order} - {day.name}
          </div>
        ))}
      </div>

      {/* ENDINGS LIST */}
      <div className={styles.col}>
        <div className={styles.headerRow}>
        <h3 className={styles.title}>🏁 Endings</h3>

        <button
            className={styles.addBtn}
            onClick={() => {
            setIsEditorOpen(true)
            setSelectedEnding(null)
            setForm({
                title: "",
                message: "",
                type: "",
                isDraft: true
            })
            }}
        >
            + Thêm Ending
        </button>
        </div>

        {!selectedDay && <p>Chọn Day trước</p>}

        {Object.entries(grouped).map(([type, list]) => (
          <div key={type} className={styles.groupBox}>

            <div className={styles.groupTitle}>
              {endingLabel[type] || type}
              <span className={styles.groupCount}>{list.length}</span>
            </div>

            {list.map(e => (
            <div
            key={e.id}
            className={`${styles.item} ${selectedEnding === e.id ? styles.active : ""}`}
            onClick={() => selectEnding(e)}
            >
            {/* LEFT */}
            <div className={styles.itemContent}>
                <div className={styles.itemTop}>
                <b>{e.title}</b>

                <span
                    className={
                    e.isDraft ? styles.draftBadge : styles.publicBadge
                    }
                >
                    {e.isDraft ? "Nháp" : "Công khai"}
                </span>
                </div>

                <p>{e.message.slice(0, 60)}...</p>
            </div>

            {/* RIGHT IMAGE */}
            {e.image && (
                <img
                src={e.image}
                className={styles.thumb}
                alt=""
                />
            )}
            </div>
            ))}

          </div>
        ))}
      </div>

      {/* EDITOR */}
      {isEditorOpen && (
        <div className={styles.editor}>

        <div className={styles.headerRow}>
        <h3 className={styles.title}>🏁 Chỉnh sửa Ending</h3>
        </div>
            

            <input
                className={styles.input}
                placeholder="Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <textarea
                className={styles.textarea}
                placeholder="Message"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
            />

            <input
            className={styles.input}
            placeholder="Image URL (anime...)"
            value={form.image || ""}
            onChange={e => setForm({ ...form, image: e.target.value })}
            />

            {/* preview ảnh */}
            {form.image && (
            <img
                src={form.image}
                className={styles.preview}
                alt="preview"
                onError={(e) => {
                console.log("Image lỗi:", form.image)
                e.currentTarget.style.display = "none"
                }}
            />
            )}


            <select
                className={styles.select}
                value={form.type}
                onChange={e =>
                setForm({ ...form, type: e.target.value as EndingType })
                }
            >
                <option value="">-- Type --</option>
                <option value="good">Tốt</option>
                <option value="medium">Trung bình</option>
                <option value="bad">Xấu</option>
                <option value="win">Win</option>
                <option value="lose">Lose</option>
            </select>

            <label className={styles.checkbox}>
            <input
                type="checkbox"
                checked={form.isDraft}
                onChange={e =>
                setForm({ ...form, isDraft: e.target.checked })
                }
            />
            Bản nháp (Draft)
            </label>

            <div className={styles.actions}>

                <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={saveEnding}
                >
                {selectedEnding ? "Sửa" : "Thêm"}
                </button>

                {selectedEnding && (
                <button
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={deleteEnding}
                >
                    Xóa
                </button>
                )}

            </div>

            </div>
      )}

    </div>
  )
}