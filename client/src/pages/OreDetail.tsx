import { Link, useParams } from 'react-router-dom'
import { ApiError, useApi, type Ore } from '../api'
import { ENV_PT, METAL_COLOR, cap, value } from '../df'
import { ingotSprite, oreSprite } from '../sprites'
import { Digging, ErrorBox, NotFoundCard, PageHead, Panel, Sprite } from '../ui'

export default function OreDetail() {
  const { id } = useParams()
  const { data: o, error } = useApi<Ore>(`/ores/${id}`)
  const siblings = useApi<Ore[]>(o ? `/metals/${o.metal}/ores` : null)
  if (error instanceof ApiError && error.status === 404) return <NotFoundCard what="minério" back="/ores" />
  if (error) return <ErrorBox error={error} />
  if (!o) return <Digging label="Quebrando a rocha" />
  return (
    <>
      <PageHead glyph="▲" title={o.name} />
      <nav className="crumbs" aria-label="Trilha"><Link to="/ores">Mineração</Link> <span aria-hidden>►</span> {o.name}</nav>
      <div className="detail">
        <div className="detail-art smelt">
          <Sprite grid={oreSprite(o.metal, o.environment)} size={160} className="glint" label={o.name} />
          <span className="smelt-arrow" aria-hidden>► fundir ►</span>
          <Sprite grid={ingotSprite(o.metal)} size={120} className="idle" label={`Barra de ${o.metal}`} />
        </div>
        <Panel title="Ficha" className="sheet">
          <dl className="facts">
            <dt>Metal</dt><dd><Link to={`/ores?metal=${o.metal}`} style={{ color: METAL_COLOR[o.metal] }}>{cap(o.metal)}</Link></dd>
            <dt>Onde aparece</dt><dd>{cap(ENV_PT[o.environment] ?? o.environment)}</dd>
            <dt>Valor</dt><dd className="price">{value(o.value)}</dd>
          </dl>
          {siblings.data && siblings.data.length > 1 && (
            <>
              <h3 className="sub">Outros minérios de {o.metal}</h3>
              <ul className="mini-list">
                {siblings.data.filter((s) => s.id !== o.id).map((s) => (
                  <li key={s.id}><Link to={`/ores/${s.id}`}><Sprite grid={oreSprite(s.metal, s.environment)} size={40} />{s.name}</Link></li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>
    </>
  )
}
