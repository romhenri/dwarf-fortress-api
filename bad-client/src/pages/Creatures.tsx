import { useEffect, useState } from 'react'
import { get, del } from '../api'

type Creature = { id: number; name: string; biome: string; hostile: number; size: number; description: string }

export default function Creatures() {
  const [q, setQ] = useState('')
  const [hostile, setHostile] = useState('')
  const [creatures, setCreatures] = useState<Creature[]>([])

  useEffect(() => {
    const params = new URLSearchParams({ limit: '10' })
    if (q) params.set('q', q)
    if (hostile) params.set('hostile', hostile)
    get(`/creatures?${params}`).then((data) => setCreatures(data.items))
  }, [q, hostile])

  async function remove(id: number) {
    await del(`/creatures/${id}`)
  }

  return (
    <div>
      <h1>Criaturas</h1>

      <div className="filters">
        <input placeholder="Buscar pelo nome..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={hostile} onChange={(e) => setHostile(e.target.value)}>
          <option value="">Todas</option>
          <option value="true">Hostis</option>
          <option value="false">Pacíficas</option>
        </select>
      </div>

      <div className="grid">
        {creatures.map((c) => (
          <div key={c.id} className="card" onClick={() => (window.location.href = `/creatures/${c.id}`)}>
            <h3>{c.name}</h3>
            <p>Bioma: {c.biome}</p>
            <p>Hostil: {c.hostile}</p>
            <p>Tamanho: {c.size}</p>
            <button
              className="danger"
              onClick={(e) => {
                e.stopPropagation()
                remove(c.id)
              }}
            >
              Apagar
            </button>
          </div>
        ))}
      </div>

      <p className="footer">
        Não achou a sua? <a href="/creatures/new">Cadastre uma criatura</a>.
      </p>
    </div>
  )
}
