"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import styles from "./admin.module.css"

export default function AdminLayout({ children }: any) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const Item = ({ href, icon, label }: any) => {
    const isExact = pathname === href

    const isChild =
        href !== "/admin" && pathname.startsWith(href)

    const active = isExact || isChild

    return (
        <Link
        href={href}
        className={`${styles.navItem} ${active ? styles.active : ""}`}
        onClick={() => setOpen(false)}
        >
        <span className="material-symbols-rounded">{icon}</span>
        {label && <span>{label}</span>}
        </Link>
    )
    
  }

  const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
        const res = await fetch("/api/admin/logout", {
        method: "POST"
        })

        if (!res.ok) throw new Error()

        router.push("/login")
        router.refresh()
    } catch {
        alert("Logout failed")
    } finally {
        setLoggingOut(false)
    }
    }

  const LogoutItem = () => {
  return (
    <button
        onClick={handleLogout}
        className={`${styles.navItem} ${styles.logout}`}
        >
        <span className="material-symbols-rounded">logout</span>
        <span>Logout</span>
        </button> 
    )
   }

  return (
    <div className={styles.container}>

      {/* HEADER */}
      <div className={styles.header}>
        <button onClick={() => setOpen(true)}>
          <span className="material-symbols-rounded">menu</span>
        </button>

        <h2>Admin</h2>

        <span className="material-symbols-rounded">
          account_circle
        </span>
      </div>

      {/* DRAWER */}
      <div
        className={`${styles.drawer} ${open ? styles.show : ""}`}
        onClick={() => setOpen(false)}
      >
        <div
          className={styles.drawerContent}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.drawerHeader}>
            <h3>Admin Panel</h3>
            <button onClick={() => setOpen(false)}>
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          {/* ===== TỔNG QUAN ===== */}
          <p className={styles.groupTitle}>Tổng quan</p>
          <Item href="/admin" icon="dashboard" label="Dashboard" />
          <Item href="/admin/analytics" icon="analytics" label="Thống kê" />

          {/* ===== NỘI DUNG GAME ===== */}
          <p className={styles.groupTitle}>Nội dung game</p>
          <Item href="/admin/days" icon="calendar_month" label="Days" />
          <Item href="/admin/stages" icon="view_module" label="Stages" />
          <Item href="/admin/questions" icon="quiz" label="Questions" />
          <Item href="/admin/stories" icon="auto_stories" label="Story" />
          <Item href="/admin/endings" icon="movie" label="Endings" />

          {/* ===== QUẢN LÝ ===== */}
          <p className={styles.groupTitle}>Quản lý</p>
          <Item href="/admin/users" icon="group" label="Người dùng" />

          <LogoutItem />

        </div>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>{children}</div>

      {/* TAB BAR */}
      <div className={styles.tabbar}>
        <Item href="/admin" icon="dashboard" />
        <Item href="/admin/users" icon="group"/>
        <Item href="/admin/days" icon="calendar_month" />
        <Item href="/admin/stages" icon="view_module" />
        <Item href="/admin/questions" icon="quiz" />
        <Item href="/admin/stories" icon="auto_stories" />
        <Item href="/admin/analytics" icon="analytics" />
      </div>
    </div>
  )
}