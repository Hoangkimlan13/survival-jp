import React from "react";

type ReadingItem = {
  text: string
  reading?: string
}

function alignReadingToText(text: string, reading: ReadingItem[]) {
  const result: ReadingItem[] = []
  let cursor = 0

  for (const item of reading) {
    if (!item.text) continue

    const foundAt = text.indexOf(item.text, cursor)

    if (foundAt === -1) {
      result.push(item)
      continue
    }

    if (foundAt > cursor) {
      result.push({ text: text.slice(cursor, foundAt) })
    }

    result.push(item)
    cursor = foundAt + item.text.length
  }

  if (cursor < text.length) {
    result.push({ text: text.slice(cursor) })
  }

  return result
}

export function renderJapanese(text: string, reading?: ReadingItem[]) {
  if (!reading?.length) {
    return <span className="jpText">{text}</span>;
  }

  const alignedReading = alignReadingToText(text, reading)

  return (
    <span className="jpText">
      {alignedReading.map((item, i) => {
        const hasRuby =
          item.reading &&
          item.text &&
          item.reading !== item.text 

        // 🎌 Luôn hiển thị furigana cho kanji để học tiếng Nhật chuẩn
        const hasKanji = /[\u4e00-\u9faf]/.test(item.text)

        if (hasRuby || (hasKanji && item.reading)) {
          return (
            <ruby key={i}>
              {item.text}
              <rt>{item.reading}</rt>
            </ruby>
          );
        }

        return <span key={i}>{item.text}</span>;
      })}
    </span>
  );
}
