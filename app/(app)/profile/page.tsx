"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getProgress } from "@/lib/progress"
import { api } from "@/src/game/api"
import { getRankName } from "@/src/game/config"

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
    return (
      <div className="loadingWrapper">
        <div className="loadingCard">
          {/* Hiệu ứng ánh sáng quét qua Card */}
          <div className="cardGlow"></div>
          
          <div className="loadingText">ĐANG KHỞI TẠO...</div>
          
          <div className="spinner">
            <div className="progressFill"></div>
          </div>
          
          <div className="loadingSub">Đang thiết lập hồ sơ sinh tồn</div>
          
          {/* Chỉ số giả lập chuẩn chất game sinh tồn */}
          <div className="loadingData">
            <span>DỮ LIỆU: SẴN SÀNG</span>
            <span>KẾT NỐI: ỔN ĐỊNH</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">

      {/* HEADER */}
      <div className="profileHeader">
        <div className="systemBar">
          <button onClick={() => router.push("/")} className="compactBackBtn">
            <span className="material-symbols-rounded">arrow_back_ios</span>
          </button>
          
          <div className="statusGroup">
            <div className="statItem money">
              <span className="material-symbols-rounded">paid</span>
              <span className="statVal">{(progress.coins ?? 0).toLocaleString("en-US")}</span>
            </div>
            
            <div className="statItem energy">
              ⭐
              <span className="statVal">{(progress.xp ?? 0).toLocaleString("en-US")}</span>
            </div>

            <div className="levelEmblem">
              <div className="levelHex">
                <span className="lvNum">{progress.level ?? 1}</span>
              </div>
              <div className="rankInfo">
                <span className="rankLabel">RANK</span>
                <span className="rankName">{getRankName(progress.level ?? 1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mainTitleRow">
          <div className="titleWrapper">
            <h1>HỒ SƠ SINH TỒN</h1>
            <div className="statusLine">
              <span className="statusDot"></span>
              <span className="statusTag">SYSTEM ACTIVE</span>
            </div>
          </div>
          
          <div className="progressQuickInfo">
            <div className="pBox">Ngày {progress.dayId}</div>
            <div className="pBox">Màn {progress.stageId}</div>
          </div>
        </div>
      </div>

      {/* MAP */}
      <div className="mapWrapper" ref={mapRef}>

      <div className="oceanBackground"></div>

      <div className="mapOverlay"></div>

        {/* PATH */}
        <svg className="mapPath">
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id='survivalNoise'>
              {/* Tạo vân địa hình nhám */}
              <feTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch' />
              <feColorMatrix type='saturate' values='0' />
              <feComponentTransfer>
                <feFuncR type='table' tableValues='0 1' />
                <feFuncG type='table' tableValues='0 1' />
                <feFuncB type='table' tableValues='0 1' />
                <feFuncA type='table' tableValues='0 0.15' /> {/* Chỉnh độ đậm nhạt của vân ở đây */}
              </feComponentTransfer>
            </filter>
          </svg>

          <defs>
            {/* Hiệu ứng Glow cho đường đi */}
            <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {paths.map((d, i) => (
            <path key={i} d={d} filter="url(#pathGlow)" />
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
          const size = (node as any).size ?? ""

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

              className={`node ${node.type} ${state.status} ${size} ${labelSide}`}
              style={{
                left: node.x,
                top: node.y
              }}
              onClick={() => {
                if (node.type !== "stage") return

                // ❌ khóa hoặc đã qua thì chặn cứng
                if (state.status === "locked") return

                // 🔥 chỉ cho current stage
                if (state.status === "current") {
                  router.push(`/game?stageId=${node.stage.id}&mode=play`)
                  return
                }

                if (state.status === "passed") {
                  router.push(`/game?stageId=${node.stage.id}&mode=replay`)
                }
              }}
            >

              {state.status === "current" && <div className="nodeScanner"></div>}

              {/* ICON */}
              <div className="iconWrapper">
                <span className="icon material-icons">
                  {node.type === "day" ? "Map" : 
                  state.status === "passed" ? "check" : 
                  state.status === "current" ? "play_arrow" : "lock"}
                </span>
                
                {/* Hiệu ứng viền năng lượng chạy vòng quanh cho current node */}
                {state.status === "current" && <div className="energyRing"></div>}
              </div>

              {/* DAY LABEL */}
              {node.type === "day" && (
                <div className="label">
                  Ngày {node.day.order}
                  <small>{node.day.name}</small>
                </div>
              )}

              {/* STAGE LABEL */}
              {node.type === "stage" && (
                <div className="stageLabel">
                  <span className="stageName">{node.stage.name}</span>
                  {state.status === "passed" && <span className="badge passed">ÔN LẠI</span>}
                  {state.status === "current" && <span className="badge current">TIẾP TỤC</span>}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}
