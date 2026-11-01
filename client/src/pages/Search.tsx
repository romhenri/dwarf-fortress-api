import { Link, useSearchParams } from 'react-router-dom'
import { qs, useApi, type SearchResult } from '../api'
import { biomeLook, cap, value } from '../df'
import { animalSprite, creatureSprite, gemSprite, oreSprite } from '../sprites'
import { Digging, Empty, ErrorBox, PageHead, Panel, Sprite, type Grid } from '../ui'

export default function Search() {
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() ?? ''
  const { data, error } = useApi<SearchResult>(q.length >= 2 ? `/search?${qs({ q, limit: 50 })}` : null)
  const groups: [string, string, { key: string; to: string; name: string; sub: string; grid?: Grid; glyph?: string }[]][] = data ? [
    ['☠', 'Criaturas', data.creatures.map((c) => ({ key: `c${c.id}`, to: `/creatures/${c.id}`, name: c.name, sub: biomeLook(c.biome).pt, grid: creatureSprite(c.name) }))],
    ['♞', 'Animais', data.animals.map((a) => ({ key: `a${a.id}`, to: `/animals/${a.id}`, name: a.name, sub: biomeLook(a.biome).pt, grid: animalSprite(a.name) }))],
    ['▲', 'Minérios', data.ores.map((o) => ({ key: `o${o.id}`, to: `/ores/${o.id}`, name: o.name, sub: cap(o.metal), grid: oreSprite(o.metal, o.environment) }))],
    ['♦', 'Gemas', data.gems.map((g) => ({ key: `g${g.id}`, to: `/gems?gem=${g.id}`, name: g.name, sub: value(g.value), grid: gemSprite(g.color) }))],
    ['≈', 'Biomas', data.biomes.map((b) => ({ key: `b${b.id}`, to: `/biomes/${b.name}`, name: biomeLook(b.name).pt, sub: b.name, glyph: biomeLook(b.name).glyph }))],
  ] : []
  const total = groups.reduce((n, [, , items]) => n + items.length, 0)

  return (
    <>
      <PageHead glyph="⌕" title={q ? `Busca: “${q}”` : 'Busca'}>Procurando o termo em criaturas, animais, minérios, gemas e biomas de uma só vez.</PageHead>
      {q.length < 2 ? <Empty>Digite pelo menos 2 letras na busca do topo.</Empty>
        : error ? <ErrorBox error={error} />
        : !data ? <Digging label="Vasculhando os arquivos" />
        : total === 0 ? <Empty>Nada encontrado para “{q}”. Tente “gold”, “dra” ou “cat”.</Empty>
        : (
          <div className="search-groups">
            {groups.filter(([, , items]) => items.length).map(([glyph, title, items]) => (
              <Panel key={title} title={`${glyph} ${title} (${items.length})`}>
                <ul className="row-list">
                  {items.map((it) => (
                    <li key={it.key}>
                      <Link to={it.to}>
                        {it.grid ? <Sprite grid={it.grid} size={40} /> : <span className="big-glyph" aria-hidden>{it.glyph}</span>}
                        <span><strong>{it.name}</strong><span className="small muted">{it.sub}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        )}
    </>
  )
}
