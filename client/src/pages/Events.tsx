import { useState } from 'react'
import { get, type GameEvent } from '../api'
import { EVENT_LOOK, eventLook } from '../df'
import { PageHead, Panel, useFeed } from '../ui'

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function Events() {
  const { events, status, interval, setInterval, push } = useFeed()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const shown = events.filter((e) => !hidden.has(e.type))
  const toggle = (t: string) => setHidden((h) => {
    const n = new Set(h)
    if (n.has(t)) n.delete(t)
    else n.add(t)
    return n
  })

  async function summon() {
    setBusy(true)
    try {
      push(await get<GameEvent>('/events/random'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead glyph="‼" title="Anúncios">
        O que acontece na fortaleza, em tempo real, pelo stream de eventos da API. A conexão continua aberta enquanto você navega.
      </PageHead>
      <div className="toolbar">
        <p className={`status-pill ${status}`} role="status">
          <span className="pulse" aria-hidden /> {status === 'live' ? 'Conectado ao stream' : status === 'down' ? 'Stream fora do ar, tentando de novo…' : 'Conectando…'}
        </p>
        <label className="field">
          <span>Um evento a cada</span>
          <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {[3, 5, 10, 15, 30, 60].map((s) => <option key={s} value={s}>{s} segundos</option>)}
          </select>
        </label>
        <button className="btn btn-gold" onClick={summon} disabled={busy}>⚄ Provocar um evento agora</button>
      </div>
      <fieldset className="chips">
        <legend>Mostrar</legend>
        {Object.entries(EVENT_LOOK).map(([t, look]) => (
          <button key={t} aria-pressed={!hidden.has(t)} className={hidden.has(t) ? '' : 'on'} onClick={() => toggle(t)}
            style={{ '--c': look.color } as React.CSSProperties}>
            <span aria-hidden>{look.glyph}</span> {look.label}
          </button>
        ))}
      </fieldset>
      <Panel title={`≡ Registro (${shown.length})`} className="log-panel">
        {shown.length === 0 ? <p className="muted">Silêncio na fortaleza… o próximo anúncio chega em até {interval}s.</p> : (
          <ol className="log" aria-live="polite">
            {shown.map((e) => {
              const look = eventLook(e.type)
              return (
                <li key={e.at + e.message} className={look.alarm ? 'alarm' : ''} style={{ '--c': look.color } as React.CSSProperties}>
                  <time dateTime={e.at}>{time.format(new Date(e.at))}</time>
                  <span className="kind"><span aria-hidden>{look.glyph}</span> {look.label}</span>
                  <span className="msg">{e.message}</span>
                </li>
              )
            })}
          </ol>
        )}
      </Panel>
    </>
  )
}
