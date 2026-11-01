import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { del, invalidate, qs, useApi, useDebounced, type Biome, type Creature, type Page } from '../api'
import { biomeLook, cm3 } from '../df'
import { creatureSprite } from '../sprites'
import { Empty, ErrorBox, PageHead, Pager, Seg, SkeletonCards, Sprite, useParamState } from '../ui'

const LIMIT = 12

export default function Creatures() {
  const { get, set } = useParamState()
  const [q, setQ] = useState(get('q'))
  const dq = useDebounced(q)
  useEffect(() => {
    if (dq !== get('q')) set({ q: dq })
  }, [dq])
  const page = Number(get('page', '1'))
  const path = `/creatures?${qs({
    q: get('q'), biome: get('biome'), hostile: get('hostile'), sort: get('sort', 'name'), order: get('order', 'asc'),
    limit: LIMIT, offset: (page - 1) * LIMIT,
  })}`
  const { data, error, loading } = useApi<Page<Creature>>(path)
  const biomes = useApi<Biome[]>('/biomes')

  async function remove(c: Creature) {
    await del(`/creatures/${c.id}`)
    invalidate('/creatures')
    invalidate('/stats')
    invalidate('/biomes/')
  }

  return (
    <>
      <PageHead glyph="☠" title="Bestiário">
        Tudo o que rasteja, voa ou cerca a fortaleza. Os filtros ficam na URL: compartilhe a busca.
      </PageHead>
      <div className="toolbar">
        <label className="field grow">
          <span>Nome</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: dra" />
        </label>
        <label className="field">
          <span>Bioma</span>
          <select value={get('biome')} onChange={(e) => set({ biome: e.target.value })}>
            <option value="">Todos</option>
            {biomes.data?.map((b) => <option key={b.id} value={b.name}>{biomeLook(b.name).pt}</option>)}
          </select>
        </label>
        <Seg label="Disposição" value={get('hostile')} onChange={(v) => set({ hostile: v })}
          options={[['', 'Todas'], ['true', 'Hostis'], ['false', 'Pacíficas']]} />
        <label className="field">
          <span>Ordenar</span>
          <select value={`${get('sort', 'name')}:${get('order', 'asc')}`} onChange={(e) => {
            const [sort, order] = e.target.value.split(':')
            set({ sort, order })
          }}>
            <option value="name:asc">Nome A→Z</option>
            <option value="name:desc">Nome Z→A</option>
            <option value="size:desc">Maiores primeiro</option>
            <option value="size:asc">Menores primeiro</option>
          </select>
        </label>
        <Link to="/creatures/new" className="btn btn-gold">+ Registrar criatura</Link>
      </div>

      {error ? <ErrorBox error={error} /> : loading || !data ? <SkeletonCards /> : data.items.length === 0 ? (
        <Empty>Nenhuma criatura com esses filtros. Talvez os anões estejam seguros, por enquanto.</Empty>
      ) : (
        <>
          <ul className="card-grid">
            {data.items.map((c, i) => <CreatureCard key={c.id} c={c} i={i} onDelete={() => remove(c)} />)}
          </ul>
          <Pager total={data.total} limit={LIMIT} page={page} onPage={(p) => set({ page: p }, false)} />
        </>
      )}
    </>
  )
}

function CreatureCard({ c, i, onDelete }: { c: Creature; i: number; onDelete: () => void }) {
  const look = biomeLook(c.biome)
  const [arming, setArming] = useState(false)
  return (
    <li className={`card creature ${c.hostile ? 'hostile' : 'peaceful'}`} style={{ animationDelay: `${i * 40}ms` }}>
      <Link to={`/creatures/${c.id}`} className="card-link">
        <div className="card-art" style={{ background: `radial-gradient(circle at 50% 70%, ${look.bg}, transparent 70%)` }}>
          <Sprite grid={creatureSprite(c.name)} size={96} className="idle" />
        </div>
        <h3>{c.name}</h3>
        <p className="tags">
          <span className="tag" style={{ color: look.fg }}>{look.glyph} {look.pt}</span>
          <span className={`tag ${c.hostile ? 'red' : 'green'}`}>{c.hostile ? '‼ Hostil' : '☺ Pacífica'}</span>
        </p>
        <p className="muted small">{cm3(c.size)}</p>
      </Link>
      {arming ? (
        <div className="confirm" role="group" aria-label={`Confirmar exclusão de ${c.name}`}>
          <button className="btn btn-red" onClick={onDelete} autoFocus>Apagar</button>
          <button className="btn" onClick={() => setArming(false)}>Manter</button>
        </div>
      ) : (
        <button className="icon-btn" onClick={() => setArming(true)} aria-label={`Apagar ${c.name}`} title="Apagar">✕</button>
      )}
    </li>
  )
}
