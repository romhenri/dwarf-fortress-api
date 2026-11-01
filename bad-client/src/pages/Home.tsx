import { useEffect, useState } from 'react'
import { get } from '../api'

export default function Home() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    get('/stats').then(setStats)
  }, [])

  return (
    <div>
      <h1>Dwarf Fortress Wiki</h1>
      <p>
        Bem-vindo, anão! Aqui você encontra tudo sobre o mundo. Conheça as <a href="/creatures">criaturas</a> que
        ameaçam sua fortaleza e os <a href="/biomes">biomas</a> onde elas vivem.
      </p>

      {stats && (
        <div className="stats">
          <div className="stat"><strong>{stats.creatures}</strong>criaturas</div>
          <div className="stat"><strong>{stats.animals}</strong>animais</div>
          <div className="stat"><strong>{stats.ores}</strong>minérios</div>
          <div className="stat"><strong>{stats.biomes}</strong>biomas</div>
        </div>
      )}

      <p>
        Precisa de ferro? Veja os minérios <a href="/ores">aqui</a>. Quer saber o que está acontecendo agora na
        fortaleza? Acompanhe os <a href="/events">eventos ao vivo</a>.
      </p>
    </div>
  )
}
