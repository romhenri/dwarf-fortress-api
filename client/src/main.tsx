import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Link, NavLink, Outlet, RouterProvider, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import './index.css'
import { dwarfDate } from './df'
import { Announcement, Boundary, FeedProvider, PickIcon, RouteError, useFeed, useNow, useTitle } from './ui'
import Home from './pages/Home'
import Creatures from './pages/Creatures'
import CreatureDetail from './pages/CreatureDetail'
import NewCreature from './pages/NewCreature'
import Animals from './pages/Animals'
import AnimalDetail from './pages/AnimalDetail'
import Mining from './pages/Mining'
import OreDetail from './pages/OreDetail'
import Gems from './pages/Gems'
import World from './pages/World'
import BiomeDetail from './pages/BiomeDetail'
import Dwarves from './pages/Dwarves'
import Events from './pages/Events'
import Search from './pages/Search'

const NAV = [
  ['/', '☼', 'Fortaleza'],
  ['/creatures', '☠', 'Bestiário'],
  ['/animals', '♞', 'Animais'],
  ['/ores', '▲', 'Mineração'],
  ['/gems', '♦', 'Tesouro'],
  ['/biomes', '≈', 'Mundo'],
  ['/dwarves', '☺', 'Anões'],
  ['/events', '‼', 'Anúncios'],
] as const

function Layout() {
  const now = useNow()
  const d = dwarfDate(now)
  const { status } = useFeed()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  useEffect(() => setMenu(false), [pathname])
  return (
    <div className="shell">
      <a className="skip" href="#main">Pular para o conteúdo</a>
      <header className="topbar">
        <Link to="/" className="logo" aria-label="Dwarf Fortress, página inicial">
          <PickIcon size={32} />
          <span className="logo-text">DWARF<b>FORTRESS</b></span>
        </Link>
        <p className="calendar" title={`${d.season}`}>
          <span aria-hidden>☼</span> {d.day}º de {d.month}, ano {d.year} <span className="season">· {d.season}</span>
        </p>
        <SearchBox />
        <span className={`feed-dot ${status}`} title={`Stream de eventos: ${status}`}>
          <span className="sr">Stream de eventos: </span>{status === 'live' ? 'AO VIVO' : status === 'down' ? 'OFFLINE' : '...'}
        </span>
        <button className="menu-btn btn" aria-expanded={menu} aria-controls="nav" onClick={() => setMenu((m) => !m)}>≡ Menu</button>
      </header>
      <nav id="nav" className={`nav ${menu ? 'open' : ''}`} aria-label="Principal">
        {NAV.map(([to, glyph, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <span className="glyph" aria-hidden>{glyph}</span>{label}
          </NavLink>
        ))}
      </nav>
      <main id="main" className="main">
        <Boundary key={pathname}>
          <Outlet />
        </Boundary>
      </main>
      <Announcement />
      <footer className="footer">
        <span>Dados da <a href="http://localhost:8000/docs">Dwarf Fortress API</a></span>
        <span aria-hidden>·</span>
        <span>Arte em pixel original, inspirada no jogo da Bay 12 Games</span>
      </footer>
    </div>
  )
}

function SearchBox() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const [q, setQ] = useState(pathname === '/search' ? params.get('q') ?? '' : '')
  return (
    <form role="search" className="searchbox" onSubmit={(e) => {
      e.preventDefault()
      if (q.trim().length >= 2) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
    }}>
      <label htmlFor="global-q" className="sr">Buscar em tudo</label>
      <input id="global-q" type="search" placeholder="Buscar (ex.: gold)" minLength={2} value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn" aria-label="Buscar">⌕</button>
    </form>
  )
}

function NotFound() {
  useTitle('Túnel sem saída')
  return (
    <div className="crash">
      <pre className="crash-art" aria-hidden>{'▓▓▓▓▓▓▓▓▓▓▓\n▓▓▓░░░░░▓▓▓\n▓▓░  ?  ░▓▓\n▓▓▓░░░░░▓▓▓\n▓▓▓▓▓▓▓▓▓▓▓'}</pre>
      <h1>404 · Rocha sólida</h1>
      <p>Você cavou até aqui e encontrou... nada. Este túnel não leva a lugar nenhum.</p>
      <p><Link className="btn" to="/">Voltar para a entrada</Link></p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <FeedProvider><Layout /></FeedProvider>,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/creatures', element: <Creatures /> },
      { path: '/creatures/new', element: <NewCreature /> },
      { path: '/creatures/:id', element: <CreatureDetail /> },
      { path: '/animals', element: <Animals /> },
      { path: '/animals/:id', element: <AnimalDetail /> },
      { path: '/ores', element: <Mining /> },
      { path: '/ores/:id', element: <OreDetail /> },
      { path: '/gems', element: <Gems /> },
      { path: '/biomes', element: <World /> },
      { path: '/biomes/:name', element: <BiomeDetail /> },
      { path: '/dwarves', element: <Dwarves /> },
      { path: '/events', element: <Events /> },
      { path: '/search', element: <Search /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js')
