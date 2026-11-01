import { useEffect, useState } from 'react'
import { get } from '../api'

export default function Biomes() {
  const [biomes, setBiomes] = useState<any[]>([])

  useEffect(() => {
    get('/biomes').then(setBiomes)
  }, [])

  return (
    <div>
      <h1>Biomas</h1>
      <div className="grid">
        {biomes.map((b) => (
          <div key={b.id} className="card" onClick={() => (window.location.href = `/biomes/${b.name}`)}>
            <h3>{b.name}</h3>
            <p>Selvageria: {b.savagery}</p>
            <p>Alinhamento: {b.alignment}</p>
          </div>
        ))}
      </div>
      <p className="footer">
        Nos biomas também vivem <a href="/animals">animais</a>.
      </p>
    </div>
  )
}
