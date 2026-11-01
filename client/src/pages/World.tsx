import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { qs, useApi, type Biome } from '../api'
import { ALIGN_PT, SAVAGERY_PT, biomeLook, hash, rng } from '../df'
import { Digging, ErrorBox, PageHead, Panel, Seg, useParamState } from '../ui'

const W = 64
const H = 30
// Hand-placed region centers, in map cells. Oceans hug the edges; caverns live underground.
const SEEDS: [string, number, number][] = [
  ['glacier', 14, 1], ['glacier', 46, 2], ['tundra', 30, 5], ['tundra', 8, 7], ['mountain', 34, 13], ['mountain', 24, 11],
  ['forest', 14, 15], ['forest', 46, 10], ['grassland', 22, 19], ['grassland', 42, 18], ['swamp', 50, 23], ['desert', 32, 24],
  ['ocean', -6, 15], ['ocean', 70, 15], ['ocean', 30, 36], ['ocean', 4, 28], ['ocean', 62, 4],
]

function makeWorld() {
  const r = rng(hash('Strike the earth'))
  const jitter = Array.from({ length: W * H }, () => r())
  return Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      let best = ''
      let bestD = Infinity
      for (const [name, sx, sy] of SEEDS) {
        const d = Math.hypot((x - sx) * 0.9, (y - sy) * 1.6) + jitter[y * W + x] * 4.5 + Math.sin(x * 0.7 + y * 0.4) * 1.5
        if (d < bestD) [best, bestD] = [name, d]
      }
      return best
    }),
  )
}

export default function World() {
  const { get, set } = useParamState()
  const biomes = useApi<Biome[]>(`/biomes?${qs({ savagery: get('savagery'), alignment: get('alignment') })}`)
  const shown = new Set(biomes.data?.map((b) => b.name))
  return (
    <>
      <PageHead glyph="≈" title="Mapa-múndi">
        O mundo gerado para esta era. Clique numa região para ver quem vive lá. Filtre pela selvageria e pelo alinhamento das terras.
      </PageHead>
      <div className="toolbar">
        <Seg label="Selvageria" value={get('savagery')} onChange={(v) => set({ savagery: v })}
          options={[['', 'Todas'], ['calm', 'Calma'], ['wild', 'Selvagem'], ['savage', 'Brutal']]} />
        <Seg label="Alinhamento" value={get('alignment')} onChange={(v) => set({ alignment: v })}
          options={[['', 'Todos'], ['good', 'Benigno'], ['neutral', 'Neutro'], ['evil', 'Maligno']]} />
      </div>
      {biomes.error ? <ErrorBox error={biomes.error} /> : !biomes.data ? <Digging label="Desenrolando o mapa" /> : (
        <>
          <WorldMap visible={shown} />
          <ul className="biome-grid">
            {biomes.data.map((b, i) => {
              const look = biomeLook(b.name)
              return (
                <li key={b.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <Link to={`/biomes/${b.name}`} className={`biome-card ${b.alignment}`} style={{ '--bg': look.bg, '--fg': look.fg } as React.CSSProperties}>
                    <span className="biome-glyph" aria-hidden>{look.glyph.repeat(3)}</span>
                    <strong>{look.pt}</strong>
                    <span className="tags">
                      <span className={`tag sav-${b.savagery}`}>{SAVAGERY_PT[b.savagery]}</span>
                      <span className={`tag al-${b.alignment}`}>{ALIGN_PT[b.alignment]}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          {biomes.data.length === 0 && <p className="muted">Nenhuma terra combina com esses filtros.</p>}
        </>
      )}
    </>
  )
}

function WorldMap({ visible }: { visible: Set<string> }) {
  const world = useMemo(makeWorld, [])
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const navigate = useNavigate()
  const CELL = 14

  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const draw = () => {
      ctx.font = `bold ${CELL}px "VT323", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const name = world[y][x]
          const look = biomeLook(name)
          const on = visible.has(name)
          const lit = hover === name
          ctx.globalAlpha = on ? 1 : 0.25
          ctx.fillStyle = look.bg
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
          let glyph = look.glyph
          if (name === 'ocean') glyph = (x + y + frame) % 4 === 0 ? '~' : '≈'
          if (name === 'mountain' && (x * 7 + y * 3) % 5 === 0) glyph = '▲'
          else if (name === 'mountain') glyph = (x + y) % 3 ? '^' : '▲'
          if (name === 'forest') glyph = (x * 3 + y) % 4 === 0 ? '♠' : '♣'
          ctx.fillStyle = lit ? '#ffffff' : look.fg
          ctx.fillText(glyph, x * CELL + CELL / 2, y * CELL + CELL / 2 + 1)
        }
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffe14a'
      ctx.fillText('☼', 34 * CELL + CELL / 2, 15 * CELL + CELL / 2)
    }
    draw()
    if (reduce) return
    const t = setInterval(() => {
      frame++
      draw()
    }, 700)
    return () => clearInterval(t)
  }, [world, visible, hover])

  const cellAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * W)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * H)
    return world[y]?.[x] ?? null
  }

  return (
    <Panel title={hover ? `${biomeLook(hover).glyph} ${biomeLook(hover).pt}` : 'Mundo de Ast Shatterhammer, ano 251'} className="world">
      <div className="map-frame">
        <canvas ref={canvas} width={W * CELL} height={H * CELL} className="map"
          aria-label="Mapa do mundo. Use a lista de regiões abaixo para navegar pelo teclado."
          onMouseMove={(e) => setHover(cellAt(e))} onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            const name = cellAt(e)
            if (name) navigate(`/biomes/${name}`)
          }}
          style={{ cursor: hover ? 'pointer' : 'default' }} />
        <Link to="/biomes/caverns" className={`underground ${visible.has('caverns') ? '' : 'dim'}`}>
          <span aria-hidden>Ω Ω Ω</span> Cavernas: o subterrâneo se estende sob o mundo inteiro <span aria-hidden>Ω Ω Ω</span>
        </Link>
      </div>
      <p className="legend small muted"><span style={{ color: '#ffe14a' }}>☼</span> sua fortaleza</p>
    </Panel>
  )
}
