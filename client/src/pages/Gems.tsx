import { qs, useApi, type Gem, type Page } from '../api'
import { GEM_COLOR, RARITY_MARK, RARITY_PT, cap, value } from '../df'
import { gemSprite } from '../sprites'
import { Digging, Empty, ErrorBox, PageHead, Panel, Seg, Sprite, useParamState } from '../ui'

const COLOR_PT: Record<string, string> = {
  clear: 'incolor', green: 'verde', red: 'vermelha', blue: 'azul', violet: 'violeta', yellow: 'amarela', aqua: 'água',
  black: 'negra', cyan: 'ciano',
}

export default function Gems() {
  const { get, set } = useParamState()
  const selected = get('gem')
  const list = useApi<Page<Gem>>(`/gems?${qs({ color: get('color'), rarity: get('rarity'), sort: get('sort', 'value'), order: get('order', 'desc'), limit: 100 })}`)
  const gem = useApi<Gem>(selected ? `/gems/${selected}` : null)

  return (
    <>
      <PageHead glyph="♦" title="Tesouro">
        Gemas lapidadas pelos melhores artesãos. A marca em volta do nome segue a qualidade do jogo: -comum-, +incomum+, *rara*, ☼lendária☼.
      </PageHead>
      <div className="toolbar">
        <Seg label="Raridade" value={get('rarity')} onChange={(v) => set({ rarity: v })}
          options={[['', 'Todas'], ['common', 'Comum'], ['uncommon', 'Incomum'], ['rare', 'Rara'], ['legendary', 'Lendária']]} />
        <fieldset className="swatches">
          <legend>Cor</legend>
          <button className={!get('color') ? 'on' : ''} aria-pressed={!get('color')} onClick={() => set({ color: '' })}>todas</button>
          {Object.entries(GEM_COLOR).map(([c, hex]) => (
            <button key={c} className={get('color') === c ? 'on' : ''} aria-pressed={get('color') === c}
              onClick={() => set({ color: c })} title={COLOR_PT[c]}>
              <span className="swatch" style={{ background: hex }} aria-hidden />{COLOR_PT[c]}
            </button>
          ))}
        </fieldset>
        <Seg label="Valor" value={get('order', 'desc')} onChange={(v) => set({ order: v })}
          options={[['desc', '▼ Maior'], ['asc', '▲ Menor']]} />
      </div>

      <div className="treasury">
        <div className="vault">
          {list.error ? <ErrorBox error={list.error} /> : !list.data ? <Digging label="Abrindo o cofre" /> : list.data.items.length === 0 ? (
            <Empty>O cofre está vazio para esses filtros.</Empty>
          ) : (
            <ul className="gem-grid">
              {list.data.items.map((g, i) => (
                <li key={g.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <button className={`gem ${g.rarity} ${selected === String(g.id) ? 'on' : ''}`} aria-pressed={selected === String(g.id)}
                    onClick={() => set({ gem: g.id }, false)}>
                    <Sprite grid={gemSprite(g.color)} size={64} className="sparkle" />
                    <span className={`gem-name ${g.rarity}`}>{RARITY_MARK[g.rarity][0]}{g.name}{RARITY_MARK[g.rarity][1]}</span>
                    <span className="price">{value(g.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Panel title="☼ Lupa do lapidário" className="loupe" as="aside">
          {!selected ? <p className="muted">Escolha uma gema para examinar.</p> : gem.error ? <ErrorBox error={gem.error} /> : !gem.data ? <Digging label="Polindo" /> : (
            <div className="loupe-body" key={gem.data.id}>
              <div className="loupe-glass" style={{ '--glow': GEM_COLOR[gem.data.color] } as React.CSSProperties}>
                <Sprite grid={gemSprite(gem.data.color)} size={160} className="spin" label={gem.data.name} />
              </div>
              <h3 className={`gem-name ${gem.data.rarity}`}>{RARITY_MARK[gem.data.rarity][0]}{gem.data.name}{RARITY_MARK[gem.data.rarity][1]}</h3>
              <dl className="facts">
                <dt>Cor</dt><dd style={{ color: GEM_COLOR[gem.data.color] }}>{cap(COLOR_PT[gem.data.color] ?? gem.data.color)}</dd>
                <dt>Raridade</dt><dd className={gem.data.rarity}>{cap(RARITY_PT[gem.data.rarity])}</dd>
                <dt>Valor</dt><dd className="price">{value(gem.data.value)}</dd>
              </dl>
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
