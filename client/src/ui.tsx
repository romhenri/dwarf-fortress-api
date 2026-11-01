import { Component, createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useRouteError, useSearchParams } from 'react-router-dom'
import { ApiError, type GameEvent } from './api'
import { PICK, dwarfSprite, type Grid } from './sprites'

export type { Grid }
import { eventLook } from './df'

// ---------------------------------------------------------------- sprites

/** Draws a 16x16 pixel grid as crisp SVG, one rect per horizontal run of color. */
export function Sprite({ grid, size = 64, label, className = '', flip = false }:
  { grid: Grid; size?: number; label?: string; className?: string; flip?: boolean }) {
  const rects = useMemo(() => {
    const out: ReactNode[] = []
    grid.forEach((row, y) => {
      let x = 0
      while (x < row.length) {
        const c = row[x]
        let w = 1
        while (c && row[x + w] === c) w++
        if (c) out.push(<rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={c} />)
        x += w
      }
    })
    return out
  }, [grid])
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges"
      className={`sprite ${className}`} style={flip ? { transform: 'scaleX(-1)' } : undefined}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {rects}
    </svg>
  )
}

// ---------------------------------------------------------------- page chrome

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Dwarf Fortress`
  }, [title])
}

export function PageHead({ glyph, title, children }: { glyph: string; title: string; children?: ReactNode }) {
  useTitle(title)
  return (
    <header className="page-head">
      <h1><span className="glyph" aria-hidden>{glyph}</span> {title}</h1>
      {children && <p className="lede">{children}</p>}
    </header>
  )
}

export function Panel({ title, children, className = '', as: Tag = 'section' }:
  { title?: ReactNode; children: ReactNode; className?: string; as?: 'section' | 'aside' | 'div' }) {
  return (
    <Tag className={`panel ${className}`}>
      {title && <h2 className="panel-title"><span>{title}</span></h2>}
      {children}
    </Tag>
  )
}

/** A dwarf digging while data loads. */
export function Digging({ label = 'Escavando' }: { label?: string }) {
  const miner = useMemo(() => dwarfSprite('Urist Digger', 'Miner'), [])
  return (
    <div className="digging" role="status" aria-live="polite">
      <div className="digging-scene" aria-hidden>
        <Sprite grid={miner} size={64} className="dig-dwarf" />
        <span className="rubble">▓▒░</span>
      </div>
      <p>{label}<span className="dots" /></p>
    </div>
  )
}

export function SkeletonCards({ n = 8 }: { n?: number }) {
  return (
    <div className="card-grid" aria-hidden>
      {Array.from({ length: n }, (_, i) => <div key={i} className="card skeleton" />)}
    </div>
  )
}

export function ErrorBox({ error, retry }: { error: Error; retry?: () => void }) {
  const offline = !(error instanceof ApiError)
  return (
    <div className="error-box" role="alert">
      <p className="error-glyph" aria-hidden>☠</p>
      <p><strong>{offline ? 'A fortaleza não responde.' : `Erro ${(error as ApiError).status}`}</strong></p>
      <p>{offline ? 'A API está de pé em localhost:8000? Rode `uvicorn main:app --reload` na raiz.' : error.message}</p>
      {retry && <button className="btn" onClick={retry}>Tentar de novo</button>}
    </div>
  )
}

export function NotFoundCard({ what, back }: { what: string; back: string }) {
  useTitle('Não encontrado')
  return (
    <div className="crash">
      <pre className="crash-art" aria-hidden>{'▓▓▓▓▓▓▓\n▓░ ? ░▓\n▓▓▓▓▓▓▓'}</pre>
      <h1>Nenhum registro</h1>
      <p>Os arquivos da fortaleza não têm nenhum registro de {what} com esse endereço. Talvez tenha sido apagado, ou nunca existiu.</p>
      <p><Link className="btn" to={back}>◄ Voltar</Link></p>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty"><span aria-hidden>░▒▓</span><p>{children}</p></div>
}

// ---------------------------------------------------------------- URL-backed state

/** Reads and writes query-string params, so filters survive F5, links and the back button. */
export function useParamState() {
  const [params, setParams] = useSearchParams()
  const get = (k: string, d = '') => params.get(k) ?? d
  const set = (patch: Record<string, string | number | null>, resetPage = true) =>
    setParams((p) => {
      const next = new URLSearchParams(p)
      for (const [k, v] of Object.entries(patch)) (v === '' || v == null ? next.delete(k) : next.set(k, String(v)))
      if (resetPage && !('page' in patch)) next.delete('page')
      return next
    }, { replace: true })
  return { get, set, params }
}

export function Pager({ total, limit, page, onPage }: { total: number; limit: number; page: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total ? (page - 1) * limit + 1 : 0
  const to = Math.min(total, page * limit)
  return (
    <nav className="pager" aria-label="Paginação">
      <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>◄ Anterior</button>
      <span>{from}–{to} de {total} · página {page}/{pages}</span>
      <button className="btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima ►</button>
    </nav>
  )
}

export function Seg<T extends string>({ label, value, options, onChange }:
  { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <fieldset className="seg">
      <legend>{label}</legend>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>
      ))}
    </fieldset>
  )
}

export function Stat({ label, value, glyph, color }: { label: string; value: number; glyph: string; color?: string }) {
  const shown = useCountUp(value)
  return (
    <div className="stat">
      <span className="stat-glyph" style={{ color }} aria-hidden>{glyph}</span>
      <span className="stat-value">{shown}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(target)
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(Math.round(target * (1 - (1 - k) ** 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export const PickIcon = ({ size = 24 }: { size?: number }) => <Sprite grid={PICK} size={size} />

// ---------------------------------------------------------------- live events (one shared SSE connection)

type Feed = {
  events: GameEvent[]; status: 'connecting' | 'live' | 'down'; interval: number
  setInterval: (s: number) => void; push: (e: GameEvent) => void
}
const FeedCtx = createContext<Feed>({ events: [], status: 'connecting', interval: 15, setInterval: () => {}, push: () => {} })
export const useFeed = () => useContext(FeedCtx)

export function FeedProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<GameEvent[]>([])
  const [status, setStatus] = useState<Feed['status']>('connecting')
  const [interval, setInterval] = useState(15)
  const push = (e: GameEvent) => setEvents((list) => [e, ...list].slice(0, 100))
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setStatus('connecting')
    const es = new EventSource(`/api/events/stream?interval=${interval}`)
    let retry: ReturnType<typeof setTimeout> | undefined
    es.onopen = () => setStatus('live')
    // The browser retries dropped connections by itself, but gives up for good on an HTTP error
    // (e.g. a 500 from the proxy while the API restarts). Then we reopen it ourselves.
    es.onerror = () => {
      if (es.readyState !== EventSource.CLOSED) return setStatus('connecting')
      setStatus('down')
      retry = setTimeout(() => setAttempt((n) => n + 1), 5000)
    }
    es.addEventListener('game', (e) => {
      setStatus('live')
      push(JSON.parse((e as MessageEvent).data))
    })
    return () => {
      clearTimeout(retry)
      es.close()
    }
  }, [interval, attempt])
  return <FeedCtx.Provider value={{ events, status, interval, setInterval, push }}>{children}</FeedCtx.Provider>
}

/** Bottom-of-screen announcement, like the game's red/yellow messages. */
export function Announcement() {
  const { events } = useFeed()
  const latest = events[0]
  const [shown, setShown] = useState<GameEvent | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    if (!latest) return
    setShown(latest)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShown(null), 7000)
    return () => clearTimeout(timer.current)
  }, [latest])
  if (!shown) return null
  const look = eventLook(shown.type)
  return (
    <Link to="/events" key={shown.at} className={`announce ${look.alarm ? 'alarm' : ''}`} style={{ color: look.color }}>
      <span aria-hidden>{look.glyph}</span> {shown.message}
    </Link>
  )
}

// ---------------------------------------------------------------- errors

export class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    return this.state.error ? <Crash error={this.state.error} /> : this.props.children
  }
}

export function RouteError() {
  return <Crash error={useRouteError() as Error} />
}

function Crash({ error }: { error: Error }) {
  useTitle('Desastre')
  return (
    <div className="crash">
      <pre className="crash-art" aria-hidden>{'   ☼ ☼ ☼\n ▓▓▓▓▓▓▓▓▓\n ▓ R.I.P ▓\n ▓▓▓▓▓▓▓▓▓'}</pre>
      <h1>Losing is fun!</h1>
      <p>Esta parte da fortaleza desabou: <code>{error?.message ?? String(error)}</code></p>
      <p><a className="btn" href="/">Voltar para a entrada</a></p>
    </div>
  )
}

export function useNow(ms = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}
