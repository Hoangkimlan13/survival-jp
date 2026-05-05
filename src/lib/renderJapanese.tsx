import React from "react";

export function renderJapanese(text: string, reading?: any[]) {
  if (!reading?.length) {
    return <span className="jpText">{text}</span>;
  }

  return (
    <span className="jpText">
      {reading.map((item, i) => {
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