"use client"

import { useEffect, useState } from "react"
import styles from "./admin.module.css"

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(setStats)
  }, [])

  if (!stats) return <p>Loading...</p>

  return (
    <div>
      <h1 style={{ marginBottom: 16, fontWeight: 800 }}>
        Dashboard
      </h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Users</h3>
          <p>{stats.users}</p>
        </div>

        <div className={styles.card}>
          <h3>Plays</h3>
          <p>{stats.plays}</p>
        </div>

        <div className={styles.card}>
          <h3>Completion</h3>
          <p>{stats.completion}%</p>
        </div>

        <div className={styles.card}>
          <h3>Drop</h3>
          <p>{stats.drop}%</p>
        </div>
      </div>
    </div>
  )
}