import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useFresh, type Creature, type GameEvent, type Stats } from '../api'
import { C, biomeLook, cm3, eventLook, value } from '../df'
import { animalSprite, creatureSprite, dwarfSprite, gemSprite, oreSprite } from '../sprites'
import { Digging, ErrorBox, Panel, Sprite, Stat, useFeed, useTitle } from '../ui'

export default function Home() {
  useTitle('Fortaleza')
  const index = useApi<{ message: string }>('/')
  const stats = useApi<Stats>('/stats')
  return (
    <div className="home">
      <Hero motto={index.data?.message} />
      {stats.error ? <ErrorBox error={stats.error} /> : stats.loading || !stats.data ? <Digging label="Contando o tesouro" /> : (
        <section className="stats" aria-label="Estatísticas da fortaleza">
          <Stat glyph="☠" color={C.lred} value={stats.data.creatures} label="criaturas" />
          <Stat glyph="‼" color={C.red} value={stats.data.hostile_creatures} label="hostis" />
          <Stat glyph="♞" color={C.lgreen} value={stats.data.animals} label="animais" />
          <Stat glyph="♥" color={C.lmagenta} value={stats.data.tameable_animals} label="domesticáveis" />
          <Stat glyph="▲" color={C.lgray} value={stats.data.ores} label="minérios" />
          <Stat glyph="≡" color={C.yellow} value={stats.data.metals} label="metais" />
          <Stat glyph="♦" color={C.lcyan} value={stats.data.gems} label="gemas" />
          <Stat glyph="≈" color={C.lblue} value={stats.data.biomes} label="biomas" />
        </section>
      )}
      <div className="home-grid">
        <Threat />
        {stats.data && <Records stats={stats.data} />}
        <RecentEvents />
      </div>
      <Doors />
    </div>
  )
}

function Hero({ motto }: { motto?: string }) {
  const crew = useMemo(() => [
    dwarfSprite('Urist McMiner', 'Miner'), dwarfSprite('Kogan Ironfist', 'Hammerdwarf'), dwarfSprite('Litast Alebrew', 'Brewer'),
  ], [])
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-sky" aria-hidden>
        <span className="mountain m1" /><span className="mountain m2" /><span className="mountain m3" />
      </div>
      <div className="hero-rock" aria-hidden>
        <span className="torch t1" /><span className="torch t2" />
        <div className="tunnel">
          {crew.map((g, i) => <Sprite key={i} grid={g} size={56} className={`walker w${i}`} />)}
        </div>
        <span className="vein v1">☼</span><span className="vein v2">*</span><span className="vein v3">☼</span>
      </div>
      <div className="hero-copy">
        <h1 id="hero-title" className="title-logo">DWARF<br />FORTRESS</h1>
        <p className="motto"><span className="typing">{motto ?? 'Strike the earth!'}</span></p>
        <p className="hero-sub">Um compêndio vivo das criaturas, minérios, gemas e terras do mundo. Os anúncios da fortaleza chegam em tempo real.</p>
        <div className="hero-cta">
          <Link className="btn btn-gold" to="/creatures">☠ Abrir o bestiário</Link>
          <Link className="btn" to="/biomes">≈ Ver o mapa-múndi</Link>
        </div>
      </div>
    </section>
  )
}

function Threat() {
  const { data, error, loading, reroll } = useFresh<Creature>('/creatures/random?hostile=true')
  const look = data ? biomeLook(data.biome) : null
  return (
    <Panel title="‼ Ameaça do dia" className="threat">
      {error ? <ErrorBox error={error} retry={reroll} /> : !data ? <Digging label="Espiando o horizonte" /> : (
        <div className={`threat-body ${loading ? 'fading' : ''}`} key={data.id}>
          <Link to={`/creatures/${data.id}`} className="threat-sprite">
            <Sprite grid={creatureSprite(data.name)} size={128} className="idle" label={data.name} />
          </Link>
          <div>
            <h3><Link to={`/creatures/${data.id}`}>{data.name}</Link></h3>
            <p className="muted">vinda de <span style={{ color: look!.fg }}>{look!.glyph} {look!.pt}</span> · {cm3(data.size)}</p>
            <p>{data.description}</p>
            <button className="btn btn-red" onClick={reroll} disabled={loading}>⚄ Sortear outra</button>
          </div>
        </div>
      )}
    </Panel>
  )
}

function Records({ stats }: { stats: Stats }) {
  return (
    <Panel title="☼ Recordes" className="records">
      <div className="record">
        <Sprite grid={creatureSprite(stats.largest_creature.name)} size={64} className="idle" />
        <div><span className="muted">Maior criatura</span><strong>{stats.largest_creature.name}</strong><span>{cm3(stats.largest_creature.size)}</span></div>
      </div>
      <div className="record">
        <Sprite grid={gemSprite('cyan')} size={64} className="sparkle" />
        <div><span className="muted">Gema mais valiosa</span><strong className="legendary">☼{stats.most_valuable_gem.name}☼</strong><span>{value(stats.most_valuable_gem.value)}</span></div>
      </div>
    </Panel>
  )
}

function RecentEvents() {
  const { events, status } = useFeed()
  return (
    <Panel title="≡ Anúncios recentes" className="recent">
      {events.length === 0 ? <p className="muted">{status === 'down' ? 'Sem conexão com o stream.' : 'Aguardando notícias da fortaleza…'}</p> : (
        <ul className="log compact">
          {events.slice(0, 6).map((e: GameEvent) => {
            const look = eventLook(e.type)
            return <li key={e.at + e.message} style={{ color: look.color }}><span aria-hidden>{look.glyph}</span> {e.message}</li>
          })}
        </ul>
      )}
      <Link to="/events" className="more">Ver todos os anúncios ►</Link>
    </Panel>
  )
}

function Doors() {
  const doors = useMemo(() => [
    ['/creatures', 'Bestiário', 'Monstros, povos e megabestas', creatureSprite('Dragon')],
    ['/animals', 'Animais', 'Pets, gado e montarias', animalSprite('Horse')],
    ['/ores', 'Mineração', 'Estratos, minérios e metais', oreSprite('gold', 'vein')],
    ['/gems', 'Tesouro', 'Gemas lapidadas e raras', gemSprite('red')],
    ['/dwarves', 'Anões', 'Recrute sua expedição', dwarfSprite('Bomrek Deepdelver', 'Axedwarf')],
    ['/biomes', 'Mundo', 'Mapa e regiões', animalSprite('Giant Eagle')],
  ] as const, [])
  return (
    <nav className="doors" aria-label="Seções">
      {doors.map(([to, title, sub, g]) => (
        <Link key={to} to={to} className="door">
          <Sprite grid={g} size={72} className="idle" />
          <strong>{title}</strong>
          <span>{sub}</span>
        </Link>
      ))}
    </nav>
  )
}
