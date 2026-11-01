import { useEffect } from 'react'
import { qs, useApi, type Dwarf } from '../api'
import { HAPPINESS, PROFESSIONS } from '../df'
import { dwarfSprite } from '../sprites'
import { Digging, ErrorBox, PageHead, Panel, Sprite, useParamState } from '../ui'

const PROF_PT: Record<string, string> = {
  Miner: 'Minerador', Mason: 'Pedreiro', Carpenter: 'Carpinteiro', Brewer: 'Cervejeiro', Farmer: 'Fazendeiro',
  Fisherdwarf: 'Pescador', Woodcutter: 'Lenhador', Metalsmith: 'Ferreiro', 'Gem Cutter': 'Lapidador', Engraver: 'Gravador',
  Mechanic: 'Mecânico', Doctor: 'Médico', Hammerdwarf: 'Martelador', Axedwarf: 'Machadeiro', 'Legendary Cheesemaker': 'Queijeiro lendário',
}
const newSeed = () => Math.floor(Math.random() * 1_000_000)

export default function Dwarves() {
  const { get, set } = useParamState()
  const seed = get('seed')
  useEffect(() => {
    if (!seed) set({ seed: newSeed() })
  }, [seed])
  const count = Number(get('count', '7'))
  const { data, error } = useApi<Dwarf[]>(seed ? `/dwarves/random?${qs({ count, profession: get('profession'), seed })}` : null)

  return (
    <>
      <PageHead glyph="☺" title="Expedição">
        Sete anões partem para fundar uma fortaleza. A semente fica na URL: o mesmo link sempre traz os mesmos anões.
      </PageHead>
      <div className="toolbar">
        <label className="field">
          <span>Anões</span>
          <input type="number" min={1} max={50} value={count}
            onChange={(e) => set({ count: Math.min(50, Math.max(1, e.target.valueAsNumber || 1)) })} />
        </label>
        <label className="field">
          <span>Profissão</span>
          <select value={get('profession')} onChange={(e) => set({ profession: e.target.value })}>
            <option value="">Sortear</option>
            {PROFESSIONS.map((p) => <option key={p} value={p}>{PROF_PT[p]}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Semente</span>
          <input type="number" min={0} value={seed} onChange={(e) => set({ seed: e.target.value })} />
        </label>
        <button className="btn btn-gold" onClick={() => set({ seed: newSeed() })}>⚄ Nova expedição</button>
      </div>

      {error ? <ErrorBox error={error} /> : !data ? <Digging label="Recrutando" /> : (
        <Panel title={`☺ ${data.length} ${data.length === 1 ? 'anão' : 'anões'} · semente ${seed}`} className="roster">
          <ul className="units">
            {data.map((d, i) => {
              const mood = HAPPINESS[d.happiness] ?? { pt: d.happiness, color: '#bfbfbf', face: '☺' }
              return (
                <li key={`${seed}-${i}`} className={`unit ${d.happiness}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <Sprite grid={dwarfSprite(d.name, d.profession)} size={80} className="idle" label={`Retrato de ${d.name}`} />
                  <div className="unit-info">
                    <strong>{d.name}</strong>
                    <span className="prof">{PROF_PT[d.profession] ?? d.profession}</span>
                    <span className="small muted">{d.age} anos</span>
                  </div>
                  <span className="mood" style={{ color: mood.color }} title={mood.pt}>
                    <span className="face" aria-hidden>{mood.face}</span> {mood.pt}
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </>
  )
}
