import type { Ending, EndingType } from "./types"

const endingCache = new Map<string, Ending[]>()

export async function getEndingsCached(
  dayId: number,
  type: EndingType
): Promise<Ending[]> {

  const normalizedType = type.toLowerCase() 

  const key = `${dayId}-${normalizedType}`

  if (endingCache.has(key)) {
    return endingCache.get(key)!
  }

  try {
    const res = await fetch(
      `/api/endings?dayId=${dayId}&type=${normalizedType}`
    )

    if (!res.ok) {
      console.error("[ENDINGS FETCH FAIL]", res.status)
      return []
    }

    const data: Ending[] = await res.json()

    console.log("[FETCH ENDINGS]", {
      dayId,
      normalizedType,
      count: data.length
    })

    endingCache.set(key, data)

    return data

  } catch (err) {
    console.error("[ENDINGS ERROR]", err)
    return []
  }
}