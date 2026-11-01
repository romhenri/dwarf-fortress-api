import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get } from '../api'

export default function BiomeDetail() {
  const { name } = useParams()
  const [biome, setBiome] = useState<any>(null)

  useEffect(() => {
    get(`/biomes/${name}/inhabitants`).then(setBiome)
  }, [name])

  if (!biome) return null

  return (
    <div>
      <h1>{biome.name}</h1>
      <p>Selvageria: {biome.savagery} · Alinhamento: {biome.alignment}</p>

      <h2>Criaturas</h2>
      <ul>
        {biome.inhabitants.creatures.map((c: any) => (
          <li key={c.id}><a href={`/creatures/${c.id}`}>{c.name}</a></li>
        ))}
      </ul>

      <h2>Animais</h2>
      <ul>
        {biome.inhabitants.animals.map((a: any) => (
          <li key={a.id}>{a.name}</li>
        ))}
      </ul>
    </div>
  )
}
