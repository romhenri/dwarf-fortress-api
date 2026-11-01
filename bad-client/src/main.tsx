import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Creatures from './pages/Creatures'
import CreatureDetail from './pages/CreatureDetail'
import NewCreature from './pages/NewCreature'
import Animals from './pages/Animals'
import Ores from './pages/Ores'
import Biomes from './pages/Biomes'
import BiomeDetail from './pages/BiomeDetail'
import Events from './pages/Events'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <main className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/creatures" element={<Creatures />} />
        <Route path="/creatures/new" element={<NewCreature />} />
        <Route path="/creatures/:id" element={<CreatureDetail />} />
        <Route path="/animals" element={<Animals />} />
        <Route path="/ores" element={<Ores />} />
        <Route path="/biomes" element={<Biomes />} />
        <Route path="/biomes/:name" element={<BiomeDetail />} />
        <Route path="/events" element={<Events />} />
      </Routes>
    </main>
  </BrowserRouter>,
)
