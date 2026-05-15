"use client"

import { useState, useEffect } from "react"
import styles from "./scenes.module.css"

export default function ScenesPage() {
  const [days, setDays] = useState<any[]>([])
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  
  // State cho Form
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    audioUrl: "",
    buttonText: "Bắt đầu"
  })

  // 1. Load danh sách Day & Stage khi vào trang
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await fetch("/api/admin/scenes") // Bạn cần tạo API này
    const data = await res.json()
    setDays(data)
  }

  const selectedDay = days.find(d => d.id === selectedDayId)
  const selectedStage = selectedDay?.stages?.find((s: any) => s.id === selectedStageId)

  // 2. Khi chọn Stage, cập nhật form với dữ liệu Intro sẵn có (nếu có)
  useEffect(() => {
    if (selectedStage?.scene) {
      setFormData({
        title: selectedStage.scene.title || "",
        content: selectedStage.scene.content || "",
        image: selectedStage.scene.image || "",
        audioUrl: selectedStage.scene.audioUrl || "",
        buttonText: selectedStage.scene.buttonText || "Bắt đầu"
      })
    } else {
      setFormData({ title: "", content: "", image: "", audioUrl: "", buttonText: "Bắt đầu" })
    }
  }, [selectedStageId])

  const handleSave = async () => {
    if (!selectedStageId) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/scenes", {
        method: "POST",
        body: JSON.stringify({ ...formData, stageId: selectedStageId })
      })
      if (res.ok) {
        alert("Lưu thành công!")
        fetchData() // Refresh để cập nhật UI
      }
    } catch (error) {
      alert("Lỗi khi lưu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.sceneManager}>
      
      {/* CỘT 1: CHỌN DAY */}
      <div className={styles.column}>
        <h3>1. Chọn Ngày</h3>
        <div className={styles.list}>
          {days.map(day => (
            <button 
              key={day.id}
              className={`${styles.item} ${selectedDayId === day.id ? styles.active : ""}`}
              onClick={() => { setSelectedDayId(day.id); setSelectedStageId(null); }}
            >
              Day {day.order}: {day.name}
            </button>
          ))}
        </div>
      </div>

      {/* CỘT 2: CHỌN STAGE */}
      <div className={styles.column}>
        <h3>2. Chọn Màn chơi</h3>
        {selectedDayId ? (
          <div className={styles.list}>
            {selectedDay?.stages.map((stage: any) => (
              <button 
                key={stage.id}
                className={`${styles.item} ${selectedStageId === stage.id ? styles.active : ""}`}
                onClick={() => setSelectedStageId(stage.id)}
              >
                Màn {stage.order}: {stage.name}
                {stage.scene && <span className={styles.checkIcon}>✅</span>}
              </button>
            ))}
          </div>
        ) : <p className={styles.empty}>Vui lòng chọn Day</p>}
      </div>

      {/* CỘT 3: EDIT INTRO */}
      <div className={`${styles.column} ${styles.formColumn}`}>
        <h3>3. Thiết lập Intro</h3>
        {selectedStageId ? (
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Tiêu đề cảnh</label>
              <input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="VD: Trước cửa quán Ramen"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Lời dẫn dắt (Nội dung chính)</label>
              <textarea 
                rows={5}
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Viết kịch bản dẫn dắt người chơi tại đây..."
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Link ảnh bối cảnh (URL)</label>
              <input 
                value={formData.image} 
                onChange={e => setFormData({...formData, image: e.target.value})}
                placeholder="https://cloudinary.com/..."
              />
              {formData.image && <img src={formData.image} className={styles.preview} alt="Preview" />}
            </div>

            <div className={styles.inputGroup}>
              <label>Link nhạc nền (Audio URL)</label>
              <input 
                value={formData.audioUrl} 
                onChange={e => setFormData({...formData, audioUrl: e.target.value})}
                placeholder="Link file .mp3..."
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Chữ trên nút bấm</label>
              <input 
                value={formData.buttonText} 
                onChange={e => setFormData({...formData, buttonText: e.target.value})}
              />
            </div>

            <button 
              className={styles.saveBtn} 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        ) : <p className={styles.empty}>Vui lòng chọn Stage để bắt đầu</p>}
      </div>
    </div>
  )
}