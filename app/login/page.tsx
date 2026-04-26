"use client"

import { useState } from "react"
import styles from "./login.module.css"

export default function LoginPage() {

  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async () => {
    setToast(null)

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })

    const data = await res.json()

    if (res.ok) {
      setToast({ type: "success", message: "Đăng nhập thành công" })

      setTimeout(() => {
        window.location.href = "/admin"
      }, 500)

      return
    }

    setToast({
      type: "error",
      message: "Sai tài khoản hoặc mật khẩu"
    })
  }


  return (
    <div className={styles.wrapper}>

      {/* TOAST MUST BE HERE */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}

      <div className={styles.left}>
        <div>
          <div className={styles.brandTitle}>Survival JP</div>
          <div className={styles.brandDesc}>
            Admin dashboard for managing questions, users and learning system.
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.title}>🔐 Admin Login</div>

        <input
          className={styles.input}
          placeholder="Tên đăng nhập"
          onChange={e => setUsername(e.target.value)}
        />

        <input
          className={styles.input}
          type="password"
          placeholder="Mật khẩu"
          onChange={e => setPassword(e.target.value)}
        />

        <button className={styles.button} onClick={handleLogin}>
          Đăng nhập
        </button>

        <div className={styles.footer}>
          Secure admin panel • v1.0
        </div>
      </div>
    </div>
  )
  
}