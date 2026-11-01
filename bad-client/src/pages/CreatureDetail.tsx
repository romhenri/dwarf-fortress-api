import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get } from '../api'

export default function CreatureDetail() {
  const { id } = useParams()
  const [creature, setCreature] = useState<any>(null)

  useEffect(() => {
    get(`/creatures/${id}`).then(setCreature)
  }, [id])

  if (!creature) return null

  return (
    <div>
      <h1>{creature.name}</h1>
      <p>{creature.description}</p>
      <ul>
        <li>Bioma: <a href={`/biomes/${creature.biome}`}>{creature.biome}</a></li>
        <li>Hostil: {creature.hostile}</li>
        <li>Tamanho: {creature.size}</li>
      </ul>
      <a href="/creatures">voltar</a>
    </div>
  )
}
