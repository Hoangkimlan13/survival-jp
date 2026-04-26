export default function AppLayout({ children }: any) {
  return (
    <div className="app-shell">
      <div className="app-frame">
        {children}
      </div>
    </div>
  )
}