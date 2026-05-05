import "./globals.css"

export const metadata = {
  title: "Sinh tồn tại Nhật",
  description: "Game sinh tồn tại Nhật"
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
}

export default function RootLayout({ children }: any) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* ICON FONT */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />

        {/* GOOGLE FONTS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans&display=swap"
          rel="stylesheet"
        />

        {/* DARK MODE SCRIPT */}
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

                  document.documentElement.classList.toggle("dark", isDark);
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