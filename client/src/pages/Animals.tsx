import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { qs, useApi, useDebounced, type Animal, type Biome, type Page } from '../api'
import { biomeLook, value } from '../df'
import { animalSprite } from '../sprites'
import { Empty, ErrorBox, PageHead, Pager, Seg, SkeletonCards, Sprite, useParamState } from '../ui'

const LIMIT = 12
export const PRODUCT: Record<string, string> = { milk: '◘ Leite', wool: '≋ Lã', eggs: '○ Ovos' }

export default function Animals() {
  const { get, set } = useParamState()
  const [q, setQ] = useState(get('q'))
  const dq = useDebounced(q)
  useEffect(() => {
    if (dq !== get('q')) set({ q: dq })
  }, [dq])
  const page = Number(get('page', '1'))
  const { data, error, loading } = useApi<Page<Animal>>(`/animals?${qs({
    q: get('q'), biome: get('biome'), tameable: get('tameable'), trainable: get('trainable'), product: get('product'),
    sort: get('sort', 'name'), order: get('order', 'asc'), limit: LIMIT, offset: (page - 1) * LIMIT,
  })}`)
  const biomes = useApi<Biome[]>('/biomes')

  return (
    <>
      <PageHead glyph="♞" title="Animais">Gado, montarias e companheiros. Um anão com um gato é um anão feliz.</PageHead>
      <div className="toolbar">
        <label className="field grow">
          <span>Nome</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: llama" />
        </label>
        <label className="field">
          <span>Bioma</span>
          <select value={get('biome')} onChange={(e) => set({ biome: e.target.value })}>
            <option value="">Todos</option>
            {biomes.data?.map((b) => <option key={b.id} value={b.name}>{biomeLook(b.name).pt}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Produto</span>
          <select value={get('product')} onChange={(e) => set({ product: e.target.value })}>
            <option value="">Qualquer</option>
            {Object.entries(PRODUCT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <Seg label="Domesticável" value={get('tameable')} onChange={(v) => set({ tameable: v })}
          options={[['', 'Tanto faz'], ['true', 'Sim'], ['false', 'Não']]} />
        <Seg label="Treinável" value={get('trainable')} onChange={(v) => set({ trainable: v })}
          options={[['', 'Tanto faz'], ['true', 'Sim'], ['false', 'Não']]} />
        <label className="field">
          <span>Ordenar</span>
          <select value={`${get('sort', 'name')}:${get('order', 'asc')}`} onChange={(e) => {
            const [sort, order] = e.target.value.split(':')
            set({ sort, order })
          }}>
            <option value="name:asc">Nome A→Z</option>
            <option value="pet_value:desc">Mais valiosos</option>
            <option value="pet_value:asc">Mais baratos</option>
          </select>
        </label>
      </div>

      {error ? <ErrorBox error={error} /> : loading || !data ? <SkeletonCards /> : data.items.length === 0 ? (
        <Empty>Nenhum animal com esses filtros.</Empty>
      ) : (
        <>
          <ul className="card-grid">
            {data.items.map((a, i) => {
              const look = biomeLook(a.biome)
              return (
                <li key={a.id} className="card" style={{ animationDelay: `${i * 40}ms` }}>
                  <Link to={`/animals/${a.id}`} className="card-link">
                    <div className="card-art" style={{ background: `radial-gradient(circle at 50% 70%, ${look.bg}, transparent 70%)` }}>
                      <Sprite grid={animalSprite(a.name)} size={96} className="walk" />
                    </div>
                    <h3>{a.name}</h3>
                    <p className="tags">
                      <span className="tag" style={{ color: look.fg }}>{look.glyph} {look.pt}</span>
                      {a.product && <span className="tag">{PRODUCT[a.product] ?? a.product}</span>}
                    </p>
                    <p className="tags">
                      <span className={`tag ${a.tameable ? 'green' : 'dim'}`}>{a.tameable ? '♥ Domesticável' : '✕ Selvagem'}</span>
                      {!!a.trainable && <span className="tag cyan">⚔ Treinável</span>}
                    </p>
                    <p className="price">{a.pet_value ? value(a.pet_value) : 'sem valor'}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
          <Pager total={data.total} limit={LIMIT} page={page} onPage={(p) => set({ page: p }, false)} />
        </>
      )}
    </>
  )
}
