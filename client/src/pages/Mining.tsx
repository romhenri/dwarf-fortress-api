import { Link } from 'react-router-dom'
import { qs, useApi, type Metal, type Ore, type Page } from '../api'
import { ENV_PT, METAL_COLOR, cap, value } from '../df'
import { ingotSprite, oreSprite } from '../sprites'
import { Digging, ErrorBox, PageHead, Panel, Sprite, useParamState } from '../ui'

const STRATA = [
  { env: 'sedimentary', rock: 'Camada sedimentar', glyph: '░', bg: '#5a4a32' },
  { env: 'metamorphic', rock: 'Camada metamórfica', glyph: '▒', bg: '#44444e' },
  { env: 'igneous', rock: 'Camada ígnea', glyph: '▓', bg: '#3a2e34' },
  { env: 'vein', rock: 'Veios profundos', glyph: '≈', bg: '#2a201c' },
]

export default function Mining() {
  const { get, set } = useParamState()
  const metal = get('metal')
  const env = get('environment')
  const metals = useApi<Metal[]>('/metals')
  const ores = useApi<Page<Ore>>(`/ores?${qs({ metal, environment: env, sort: 'value', order: 'desc', limit: 100 })}`)
  const yieldOf = useApi<Ore[]>(metal ? `/metals/${metal}/ores` : null)
  const maxValue = Math.max(1, ...(metals.data ?? []).map((m) => m.value))

  return (
    <>
      <PageHead glyph="▲" title="Mineração">
        Corte uma seção da montanha. Cada camada de rocha guarda minérios diferentes. Escolha um metal para seguir o veio.
      </PageHead>

      <Panel title="≡ Metais" className="metals">
        {metals.error ? <ErrorBox error={metals.error} /> : !metals.data ? <Digging label="Fundindo" /> : (
          <ul className="ingots" role="list">
            {metals.data.map((m) => (
              <li key={m.metal}>
                <button className={`ingot ${metal === m.metal ? 'on' : ''}`} aria-pressed={metal === m.metal}
                  onClick={() => set({ metal: metal === m.metal ? '' : m.metal })}>
                  <Sprite grid={ingotSprite(m.metal)} size={48} />
                  <strong style={{ color: METAL_COLOR[m.metal] }}>{cap(m.metal)}</strong>
                  <span className="bar" aria-hidden><span style={{ width: `${(m.value / maxValue) * 100}%`, background: METAL_COLOR[m.metal] }} /></span>
                  <span className="small">{value(m.value)} · {m.ore_count} {m.ore_count === 1 ? 'minério' : 'minérios'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {metal && yieldOf.data && (
        <p className="callout" style={{ borderColor: METAL_COLOR[metal] }}>
          <Sprite grid={ingotSprite(metal)} size={32} /> {cap(metal)} sai de {yieldOf.data.map((o, i) => (
            <span key={o.id}>{i > 0 && (i === yieldOf.data!.length - 1 ? ' e ' : ', ')}<Link to={`/ores/${o.id}`}>{o.name}</Link></span>
          ))}.
          <button className="btn" onClick={() => set({ metal: '' })}>Limpar</button>
        </p>
      )}

      <section className="strata" aria-label="Corte da montanha">
        <div className="surface" aria-hidden><span>♣</span><span>"</span><span>♣</span><span>♠</span><span>"</span><span>♣</span></div>
        {STRATA.map((s) => {
          const here = ores.data?.items.filter((o) => o.environment === s.env) ?? []
          const dim = env && env !== s.env
          return (
            <div key={s.env} className={`stratum ${dim ? 'dim' : ''}`} style={{ '--rock': s.bg } as React.CSSProperties}>
              <button className="stratum-label" aria-pressed={env === s.env} onClick={() => set({ environment: env === s.env ? '' : s.env })}>
                <span aria-hidden>{s.glyph}</span> {s.rock} <span className="muted">({ENV_PT[s.env]})</span>
              </button>
              <ul className="stratum-ores">
                {ores.loading && <li className="muted">cavando…</li>}
                {!ores.loading && here.length === 0 && <li className="muted small">rocha estéril</li>}
                {here.map((o, i) => (
                  <li key={o.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <Link to={`/ores/${o.id}`} className="ore">
                      <Sprite grid={oreSprite(o.metal, o.environment)} size={56} className="glint" />
                      <span>{o.name}</span>
                      <span className="small" style={{ color: METAL_COLOR[o.metal] }}>{cap(o.metal)} · {value(o.value)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        <div className="magma" aria-hidden>≈≈≈ magma ≈≈≈</div>
      </section>
      {ores.error && <ErrorBox error={ores.error} />}
    </>
  )
}
