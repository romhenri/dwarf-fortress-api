import { useEffect, useState } from 'react'
import { get } from '../api'

export default function Animals() {
  const [tameable, setTameable] = useState('')
  const [animals, setAnimals] = useState<any[]>([])

  useEffect(() => {
    const params = new URLSearchParams({ limit: '10' })
    if (tameable) params.set('tameable', tameable)
    get(`/animals?${params}`).then((data) => setAnimals(data.items))
  }, [tameable])

  return (
    <div>
      <h1>Animais</h1>

      <div className="filters">
        <select value={tameable} onChange={(e) => setTameable(e.target.value)}>
          <option value="">Todos</option>
          <option value="true">Domesticáveis</option>
          <option value="false">Selvagens</option>
        </select>
      </div>

      <table className="wide-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Bioma</th>
            <th>Domesticável</th>
            <th>Treinável</th>
            <th>Valor de pet</th>
            <th>Produto</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.biome}</td>
              <td>{a.tameable}</td>
              <td>{a.trainable}</td>
              <td>{a.pet_value}</td>
              <td>{a.product}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
