import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, del, invalidate, useApi, type Creature, type Inhabitants } from '../api'
import { DWARF_SIZE, biomeLook, cm3, num } from '../df'
import { animalSprite, creatureSprite, dwarfSprite, hasArt } from '../sprites'
import { Digging, ErrorBox, NotFoundCard, PageHead, Panel, Sprite } from '../ui'

export default function CreatureDetail() {
  const { id } = useParams()
  const { data: c, error } = useApi<Creature>(`/creatures/${id}`)
  if (error instanceof ApiError && error.status === 404) return <NotFoundCard what="criatura" back="/creatures" />
  if (error) return <ErrorBox error={error} />
  if (!c) return <Digging label="Consultando os pergaminhos" />
  return <Detail c={c} />
}

function Detail({ c }: { c: Creature }) {
  const look = biomeLook(c.biome)
  const navigate = useNavigate()
  const [arming, setArming] = useState(false)
  const neighbours = useApi<Inhabitants>(`/biomes/${c.biome}/inhabitants`)
  const grid = useMemo(() => creatureSprite(c.name), [c.name])

  async function remove() {
    await del(`/creatures/${c.id}`)
    invalidate('/creatures')
    invalidate('/stats')
    invalidate('/biomes/')
    navigate('/creatures', { replace: true })
  }

  return (
    <>
      <PageHead glyph={c.hostile ? '‼' : '☺'} title={c.name} />
      <nav className="crumbs" aria-label="Trilha"><Link to="/creatures">Bestiário</Link> <span aria-hidden>►</span> {c.name}</nav>
      <div className="detail">
        <div className="detail-art" style={{ background: `linear-gradient(${look.sky}, ${look.bg} 70%, ${look.ground})` }}>
          <Sprite grid={grid} size={224} className="idle" label={c.name} />
          {!hasArt(c.name) && <p className="art-note">Forma procedural: cada nome gera uma fera única.</p>}
        </div>
        <Panel title="Registro" className="sheet">
          <p className="description">“{c.description || 'Nenhum relato sobrevivente descreve esta criatura.'}”</p>
          <dl className="facts">
            <dt>Bioma</dt><dd><Link to={`/biomes/${c.biome}`} style={{ color: look.fg }}>{look.glyph} {look.pt}</Link></dd>
            <dt>Disposição</dt><dd className={c.hostile ? 'red' : 'green'}>{c.hostile ? '‼ Hostil: ataca anões à vista' : '☺ Pacífica'}</dd>
            <dt>Volume</dt><dd>{cm3(c.size)}</dd>
            <dt>Em anões</dt><dd>{c.size >= DWARF_SIZE ? `≈ ${num(Math.round(c.size / DWARF_SIZE))} anões de volume` : `${Math.round((c.size / DWARF_SIZE) * 100)}% de um anão`}</dd>
          </dl>
          <div className="actions">
            {arming ? (
              <>
                <span className="red">Apagar {c.name} para sempre?</span>
                <button className="btn btn-red" onClick={remove} autoFocus>Sim, apagar</button>
                <button className="btn" onClick={() => setArming(false)}>Cancelar</button>
              </>
            ) : <button className="btn btn-red" onClick={() => setArming(true)}>✕ Apagar do bestiário</button>}
          </div>
        </Panel>
      </div>
      <SizeCompare c={c} grid={grid} />
      {neighbours.data && (
        <Panel title={`Também em ${look.pt}`}>
          <ul className="mini-list">
            {neighbours.data.creatures.filter((n) => n.id !== c.id).map((n) => (
              <li key={n.id}><Link to={`/creatures/${n.id}`}><Sprite grid={creatureSprite(n.name)} size={40} />{n.name}</Link></li>
            ))}
            {neighbours.data.animals.map((a) => (
              <li key={`a${a.id}`}><Link to={`/animals/${a.id}`}><Sprite grid={animalSprite(a.name)} size={40} />{a.name}</Link></li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}

/** Volumes scale with the cube of height, so the drawing uses the cube root. */
function SizeCompare({ c, grid }: { c: Creature; grid: ReturnType<typeof creatureSprite> }) {
  const dwarf = useMemo(() => dwarfSprite('Urist McScale', 'Miner'), [])
  const ratio = Math.cbrt(c.size / DWARF_SIZE)
  const base = 48
  const px = Math.max(16, Math.min(base * ratio, 340))
  return (
    <Panel title="⇕ Escala" className="scale">
      <div className="scale-stage">
        <figure><Sprite grid={dwarf} size={base} /><figcaption>Anão</figcaption></figure>
        <figure><Sprite grid={grid} size={px} className="grow-in" /><figcaption>{c.name} · {ratio.toFixed(1)}× a altura</figcaption></figure>
      </div>
      {base * ratio > 340 && <p className="muted small">Desenho limitado à tela: na verdade seria {Math.round(base * ratio)}px de altura.</p>}
    </Panel>
  )
}
