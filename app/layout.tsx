import "./globals.css"

export const metadata = {
  title: "Sinh tồn tại Nhật",
  description: "Game sinh tồn tại Nhật"
}

export default function RootLayout({ children }: any) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* ===== ICON FONT ===== */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded"
          rel="stylesheet"
        />

        {/* ===== GOOGLE FONTS (JP + VN + UI) ===== */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans&display=swap"
          rel="stylesheet"
        />

        {/* ===== DARK MODE GLOBAL ===== */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem("theme");
                  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

                  let isDark = false;

                  if (saved === "dark") isDark = true;
                  else if (saved === "light") isDark = false;
                  else isDark = systemDark;

                  if (isDark) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch(e) {}
              })();
            `
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  )
}