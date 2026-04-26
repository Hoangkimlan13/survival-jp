export default function Page({ params }: { params: { id: string } }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Page</h1>
      <p>ID: {params.id}</p>
    </div>
  )
}