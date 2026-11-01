import { Link, useParams } from 'react-router-dom'
import { ApiError, useApi, type Animal } from '../api'
import { biomeLook, value } from '../df'
import { animalSprite } from '../sprites'
import { Digging, ErrorBox, NotFoundCard, PageHead, Panel, Sprite } from '../ui'
import { PRODUCT } from './Animals'

export default function AnimalDetail() {
  const { id } = useParams()
  const { data: a, error } = useApi<Animal>(`/animals/${id}`)
  if (error instanceof ApiError && error.status === 404) return <NotFoundCard what="animal" back="/animals" />
  if (error) return <ErrorBox error={error} />
  if (!a) return <Digging label="Rastreando pegadas" />
  const look = biomeLook(a.biome)
  return (
    <>
      <PageHead glyph="♞" title={a.name} />
      <nav className="crumbs" aria-label="Trilha"><Link to="/animals">Animais</Link> <span aria-hidden>►</span> {a.name}</nav>
      <div className="detail">
        <div className="detail-art pasture" style={{ background: `linear-gradient(${look.sky}, ${look.sky} 60%, ${look.ground} 60%)` }}>
          <Sprite grid={animalSprite(a.name)} size={192} className="wander" label={a.name} />
        </div>
        <Panel title="Ficha" className="sheet">
          <dl className="facts">
            <dt>Bioma</dt><dd><Link to={`/biomes/${a.biome}`} style={{ color: look.fg }}>{look.glyph} {look.pt}</Link></dd>
            <dt>Domesticável</dt><dd className={a.tameable ? 'green' : 'red'}>{a.tameable ? '♥ Sim' : '✕ Não, mantenha distância'}</dd>
            <dt>Treinável</dt><dd>{a.trainable ? '⚔ Sim, para guerra ou caça' : 'Não'}</dd>
            <dt>Produto</dt><dd>{a.product ? PRODUCT[a.product] ?? a.product : 'Nenhum'}</dd>
            <dt>Valor como pet</dt><dd className="price">{a.pet_value ? value(a.pet_value) : 'Sem valor'}</dd>
          </dl>
          <Link className="btn" to={`/animals?biome=${a.biome}`}>Outros animais de {look.pt} ►</Link>
        </Panel>
      </div>
    </>
  )
}
