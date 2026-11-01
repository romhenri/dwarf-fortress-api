import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, useApi, type Inhabitants } from '../api'
import { ALIGN_PT, SAVAGERY_PT, biomeLook, cm3, hash, rng, value } from '../df'
import { animalSprite, creatureSprite } from '../sprites'
import { Digging, Empty, ErrorBox, NotFoundCard, PageHead, Panel, Sprite } from '../ui'

export default function BiomeDetail() {
  const { name = '' } = useParams()
  const { data: b, error } = useApi<Inhabitants>(`/biomes/${name}/inhabitants`)
  if (error instanceof ApiError && error.status === 404) return <NotFoundCard what="região" back="/biomes" />
  if (error) return <ErrorBox error={error} />
  if (!b) return <Digging label="Viajando até lá" />
  const look = biomeLook(b.name)
  return (
    <>
      <PageHead glyph={look.glyph} title={look.pt} />
      <nav className="crumbs" aria-label="Trilha"><Link to="/biomes">Mundo</Link> <span aria-hidden>►</span> {look.pt}</nav>
      <Scene b={b} />
      <p className="tags center">
        <span className={`tag sav-${b.savagery}`}>{SAVAGERY_PT[b.savagery]}</span>
        <span className={`tag al-${b.alignment}`}>{ALIGN_PT[b.alignment]}</span>
        <span className="tag">{b.creatures.length} criaturas · {b.animals.length} animais</span>
      </p>
      <div className="two-col">
        <Panel title="☠ Criaturas">
          {b.creatures.length === 0 ? <Empty>Nenhuma criatura registrada. Por enquanto.</Empty> : (
            <ul className="row-list">
              {b.creatures.map((c) => (
                <li key={c.id}>
                  <Link to={`/creatures/${c.id}`}>
                    <Sprite grid={creatureSprite(c.name)} size={48} className="idle" />
                    <span><strong>{c.name}</strong><span className="small muted">{cm3(c.size)}</span></span>
                    <span className={`tag ${c.hostile ? 'red' : 'green'}`}>{c.hostile ? '‼ Hostil' : '☺ Pacífica'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="♞ Animais">
          {b.animals.length === 0 ? <Empty>Nenhum animal vive aqui.</Empty> : (
            <ul className="row-list">
              {b.animals.map((a) => (
                <li key={a.id}>
                  <Link to={`/animals/${a.id}`}>
                    <Sprite grid={animalSprite(a.name)} size={48} className="idle" />
                    <span><strong>{a.name}</strong><span className="small muted">{a.pet_value ? value(a.pet_value) : 'sem valor'}</span></span>
                    <span className={`tag ${a.tameable ? 'green' : 'dim'}`}>{a.tameable ? '♥ Domesticável' : '✕ Selvagem'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

/** A strip of landscape where the inhabitants wander back and forth. */
function Scene({ b }: { b: Inhabitants }) {
  const look = biomeLook(b.name)
  const walkers = useMemo(() => {
    const r = rng(hash(b.name))
    return [
      ...b.creatures.map((c) => ({ key: `c${c.id}`, grid: creatureSprite(c.name), hostile: !!c.hostile })),
      ...b.animals.map((a) => ({ key: `a${a.id}`, grid: animalSprite(a.name), hostile: false })),
    ].map((w) => ({ ...w, left: 5 + r() * 80, dur: 14 + r() * 16, delay: -r() * 20, size: 48 + Math.round(r() * 16) }))
  }, [b])
  const flora = useMemo(() => {
    const r = rng(hash(b.name + 'flora'))
    return Array.from({ length: 28 }, () => ({ x: r() * 100, y: r() * 40, glyph: look.glyph }))
  }, [b.name, look.glyph])
  return (
    <div className={`scene scene-${b.name}`} style={{ '--sky': look.sky, '--ground': look.ground, '--fg': look.fg } as React.CSSProperties} aria-hidden>
      {b.alignment === 'evil' && <div className="evil-haze" />}
      {(b.name === 'glacier' || b.name === 'tundra') && <div className="snow" />}
      {b.name === 'caverns' && <div className="stalactites">▼ ▼▼ ▼ ▼▼▼ ▼ ▼▼ ▼ ▼▼▼ ▼ ▼▼</div>}
      <div className="flora">
        {flora.map((f, i) => <span key={i} style={{ left: `${f.x}%`, bottom: `${f.y}%` }}>{f.glyph}</span>)}
      </div>
      {walkers.map((w) => (
        <div key={w.key} className="walker-track" style={{ left: `${w.left}%`, animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s` }}>
          <Sprite grid={w.grid} size={w.size} className={`idle ${w.hostile ? 'menace' : ''}`} />
        </div>
      ))}
    </div>
  )
}
