"use client"

import { useEffect, useState } from "react"
import styles from "./users.module.css"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const load = async () => {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    if (res.ok) setUsers(data)
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setUsername("")
    setPassword("")
    setOpen(true)
  }

  const openEdit = (u: any) => {
    setEditingId(u.id)
    setUsername(u.username)
    setPassword("")
    setOpen(true)
  }

  const handleSave = async () => {
    if (!username) {
      showToast("Nhập username")
      return
    }

    if (!editingId && !password) {
      showToast("Nhập password")
      return
    }

    setLoading(true)

    let res

    if (editingId) {
      res = await fetch(`/api/admin/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: password || undefined
        })
      })
    } else {
      res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
    }

    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      if (data.error === "USERNAME_EXISTS") {
        showToast("Username đã tồn tại")
      } else {
        showToast(data.message || "Lỗi")
      }
      return
    }

    showToast(editingId ? "Đã cập nhật" : "Tạo thành công")

    setOpen(false)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Xoá user?")) return

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE"
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.error === "USER_NOT_FOUND") {
        showToast("User không tồn tại")
      } else {
        showToast(data.message || "Xoá thất bại")
      }
      return
    }

    showToast("Đã xoá")
    load()
  }

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.topbar}>
        <h1>Quản lý Admin</h1>
        <button onClick={openCreate}>+ Thêm</button>
      </div>

      <div className={styles.table}>
        {users.map((u, index) => (
            <div key={u.id} className={styles.row}>
                
                {/* STT */}
                <div className={styles.index}>{index + 1}</div>

                {/* USERNAME */}
                <div className={styles.username}>{u.username}</div>

                {/* ACTION */}
                <div className={styles.actions}>
                <button onClick={() => openEdit(u)}>Sửa</button>
                <button onClick={() => handleDelete(u.id)}>Xóa</button>
                </div>

            </div>
        ))}
      </div>

      {open && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <h3>{editingId ? "Sửa Admin" : "Thêm Admin"}</h3>

            <input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password (bỏ trống nếu không đổi)"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <button onClick={handleSave} disabled={loading}>
              {loading ? "Đang Lưu..." : "Lưu"}
            </button>

            <button onClick={() => setOpen(false)}>Hủy</button>
          </div>
        </div>
      )}
    </div>
  )
}