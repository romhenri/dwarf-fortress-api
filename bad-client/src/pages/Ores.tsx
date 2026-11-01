import { useEffect, useState } from 'react'
import { get } from '../api'

export default function Ores() {
  const [metal, setMetal] = useState('')
  const [metals, setMetals] = useState<any[]>([])
  const [ores, setOres] = useState<any[]>([])

  useEffect(() => {
    get('/metals').then(setMetals)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams({ limit: '10' })
    if (metal) params.set('metal', metal)
    get(`/ores?${params}`).then((data) => setOres(data.items))
  }, [metal])

  return (
    <div className="ores-page">
      <h1>Minérios</h1>

      <div className="filters">
        <select value={metal} onChange={(e) => setMetal(e.target.value)}>
          <option value="">Todos os metais</option>
          {metals.map((m) => (
            <option key={m.metal} value={m.metal}>{m.metal}</option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Minério</th>
            <th>Metal</th>
            <th>Valor</th>
            <th>Ambiente</th>
          </tr>
        </thead>
        <tbody>
          {ores.map((o) => (
            <tr key={o.id}>
              <td>{o.name}</td>
              <td>{o.metal}</td>
              <td>{o.value}</td>
              <td>{o.environment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
