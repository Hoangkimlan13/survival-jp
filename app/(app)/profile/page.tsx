"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getProgress } from "@/lib/progress"
import { api } from "@/src/game/api"

import { buildMapNodes } from "./mapUtils"
import { generatePathsByDay, getNodeState } from "./useProfileMap"
import type { Day, MapNode } from "./types"

import "./profile.css"

export default function ProfilePage() {
  const router = useRouter()

  const [progress, setProgress] = useState<any>(undefined)

  const [days, setDays] = useState<Day[]>([])

  const mapRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)

  // ================= LOAD =================
  useEffect(() => {
    setProgress(getProgress())

    api.getAllDaysWithStages().then((data: Day[]) => {
      const cleaned = data
        .filter(d => d.isPublished)
        .map(d => ({
          ...d,
          stages: d.stages
            .filter(s => s.isPublished)
            .sort((a, b) => a.order - b.order)
        }))
        .sort((a, b) => a.order - b.order)

      setDays(cleaned)
    })
  }, [])

  // ================= MAP =================
  const nodes = useMemo(() => {
    if (!days?.length) return []
    return buildMapNodes(days)
  }, [days])


  const paths = useMemo(() => {
    if (!nodes.length) return []
    return generatePathsByDay(nodes)
  }, [nodes])

  // ================= AUTO CAMERA =================
  useEffect(() => {
    if (!mapRef.current || !currentRef.current) return

    const top = currentRef.current.offsetTop

    mapRef.current.scrollTo({
      top: top - 260,
      behavior: "smooth"
    })
  }, [nodes, progress])

  if (progress === undefined) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="profile">

      {/* HEADER */}
      <div className="profileHeader">

        <button onClick={() => router.push("/")} className="backBtn">
          <span className="material-icons">arrow_back_ios</span>
        </button>

        <div className="headerInfo">
          <h1>Hồ sơ sinh tồn</h1>

          <p>
            <span className="material-icons tiny">event</span>
           Ngày {progress.dayId}
            <span className="dot">•</span>

            <span className="material-icons tiny">flag</span>
            Màn {progress.stageId}
          </p>
        </div>

        <div className="xpBadge">
          ⭐
          <span>{progress.xp}</span>
        </div>

      </div>

      {/* MAP */}
      <div className="mapWrapper" ref={mapRef}>

        {/* PATH */}
        <svg className="mapPath">
          {paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>

        {/* ===== DAY SECTIONS ===== */}
        {days.map(day => {
          const first = nodes.find(n => n.day.id === day.id)
          if (!first) return null

          return (
            <div
              key={day.id}
              className="dayDivider"
              style={{ top: first.y - 110 }}
            >
              <span className="line" />
              
              <div className="dayText">
                Ngày {day.order} • {day.name}
              </div>

              <span className="line" />
            </div>
          )
        })}

        {/* NODES */}
        {nodes.map((node, i) => {
          const state = getNodeState(node, progress, days)

          const isCurrent =
            node.type === "stage" &&
            node.stage.id === progress.stageId

          const isTooLeft = node.x < 120
          const isTooRight = node.x > 310

          let labelSide = ""

          if (node.type === "stage") {
            const isLeftSide = node.x < 215

            labelSide = isLeftSide ? "right" : "left"

            if (isTooLeft) labelSide = "right"
            if (isTooRight) labelSide = "left"
          }

          return (
            <div
              key={i}
              ref={isCurrent ? currentRef : null}

              className={`node ${node.type} ${state.status} 
              ${node.type === "stage" && node.size ? node.size : ""}
              ${node.type === "stage" && labelSide}`}
              style={{
                left: node.x,
                top: node.y
              }}
              onClick={() => {
                if (node.type !== "stage") return

                // ❌ khóa hoặc đã qua thì chặn cứng
                if (state.status === "locked" || state.status === "passed") return

                // 🔥 chỉ cho current stage
                if (state.status === "current") {
                  router.push(`/game?stageId=${node.stage.id}&mode=play`)
                }
              }}
            >

              {/* ICON */}
              <span className="icon material-icons">
                {node.type === "day"
                  ? "public"
                  : node.size === "big"
                  ? "military_tech"
                  : state.status === "passed"
                  ? "check_circle"
                  : state.status === "current"
                  ? "play_circle"
                  : "lock"}
              </span>

              {/* EFFECT */}
              {state.isCurrent && (
                <span className="currentPointer material-icons">
                  keyboard_arrow_down
                </span>
              )}

              {/* DAY LABEL */}
              {node.type === "day" && (
                <div className="label">
                  Day {node.day.order}
                  <small>{node.day.name}</small>
                </div>
              )}

              {/* STAGE LABEL */}
              {node.type === "stage" && (
                <div className="stageLabel">
                  {node.stage.name}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}