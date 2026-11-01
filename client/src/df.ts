// The 16 colors of the classic Dwarf Fortress console.
export const C = {
  black: '#000000', blue: '#2a3c9e', green: '#3d8c2f', cyan: '#2f9c9c', red: '#a3241f', magenta: '#9c2f8c',
  brown: '#9c6a2f', lgray: '#bfbfbf', dgray: '#5a5a5a', lblue: '#6a7cff', lgreen: '#6cdc4a', lcyan: '#5ce6e6',
  lred: '#ff5a4a', lmagenta: '#ff6ae6', yellow: '#ffe14a', white: '#ffffff',
} as const

const nf = new Intl.NumberFormat('pt-BR')
export const num = (n: number) => nf.format(n)
export const cm3 = (n: number) => `${nf.format(n)} cm³`
export const value = (n: number) => `${nf.format(n)}☼`
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Dwarven volume, the unit everything in the bestiary is measured against. */
export const DWARF_SIZE = 60_000

// Item quality markers from the game: -common-, +fine+, *superior*, ☼masterwork☼.
export const RARITY_MARK = { common: ['-', '-'], uncommon: ['+', '+'], rare: ['*', '*'], legendary: ['☼', '☼'] } as const
export const RARITY_PT = { common: 'comum', uncommon: 'incomum', rare: 'rara', legendary: 'lendária' } as const

export const GEM_COLOR: Record<string, string> = {
  clear: '#e8f6ff', green: '#2fd46a', red: '#ff3b3b', blue: '#3b6bff', violet: '#b25cff', yellow: '#ffd23b',
  aqua: '#4ff0e0', black: '#2a2438', cyan: '#5cf6ff',
}

export const METAL_COLOR: Record<string, string> = {
  iron: '#8a8f99', gold: '#ffd23b', silver: '#dfe6ee', copper: '#d9773a', lead: '#6f7486', zinc: '#a8b4bd',
  tin: '#c9ccd1', nickel: '#b9b49a', platinum: '#eef3f8', aluminum: '#cfd8e0', bismuth: '#e08ad9',
}

export const ENV_PT: Record<string, string> = {
  sedimentary: 'sedimentar', igneous: 'ígnea', metamorphic: 'metamórfica', vein: 'veio',
}

export type BiomeLook = { pt: string; glyph: string; fg: string; bg: string; sky: string; ground: string }
export const BIOME: Record<string, BiomeLook> = {
  mountain: { pt: 'Montanha', glyph: '▲', fg: '#bfbfbf', bg: '#3a3a40', sky: '#6a7a9a', ground: '#55555c' },
  forest: { pt: 'Floresta', glyph: '♣', fg: '#6cdc4a', bg: '#173d14', sky: '#5d8fb0', ground: '#2b5a22' },
  grassland: { pt: 'Campos', glyph: '"', fg: '#a8e05a', bg: '#3d6a1f', sky: '#7fb6e0', ground: '#5c8f2f' },
  desert: { pt: 'Deserto', glyph: '~', fg: '#ffe14a', bg: '#8a6a2a', sky: '#e8b86a', ground: '#c9a04a' },
  tundra: { pt: 'Tundra', glyph: '·', fg: '#cfe3e8', bg: '#4a5a5c', sky: '#9fb3c0', ground: '#7d8d8a' },
  swamp: { pt: 'Pântano', glyph: '≈', fg: '#9c6aff', bg: '#2a2a1a', sky: '#4a4a3a', ground: '#3a3d22' },
  ocean: { pt: 'Oceano', glyph: '≈', fg: '#5ce6e6', bg: '#14246a', sky: '#3a6ab0', ground: '#1f3d8f' },
  caverns: { pt: 'Cavernas', glyph: 'Ω', fg: '#ff6ae6', bg: '#1a0f1f', sky: '#120a14', ground: '#2a1a2a' },
  glacier: { pt: 'Geleira', glyph: '░', fg: '#ffffff', bg: '#6a8aa8', sky: '#b0c8e0', ground: '#d8e8f4' },
}
export const biomeLook = (name: string): BiomeLook =>
  BIOME[name] ?? { pt: cap(name), glyph: '?', fg: C.lgray, bg: '#222', sky: '#333', ground: '#444' }

export const SAVAGERY_PT = { calm: 'Calmo', wild: 'Selvagem', savage: 'Brutal' } as const
export const ALIGN_PT = { good: 'Benigno', neutral: 'Neutro', evil: 'Maligno' } as const

export const EVENT_LOOK: Record<string, { color: string; glyph: string; label: string; alarm?: boolean }> = {
  siege: { color: C.lred, glyph: '‼', label: 'Cerco', alarm: true },
  megabeast: { color: C.lred, glyph: '☠', label: 'Megabesta', alarm: true },
  mood: { color: C.lmagenta, glyph: '☼', label: 'Humor estranho' },
  migrants: { color: C.lgreen, glyph: '☺', label: 'Migrantes' },
  caravan: { color: C.yellow, glyph: '≡', label: 'Caravana' },
  discovery: { color: C.lcyan, glyph: '*', label: 'Descoberta' },
  tantrum: { color: C.red, glyph: '!', label: 'Birra' },
  artifact: { color: C.yellow, glyph: '☼', label: 'Artefato' },
  flood: { color: C.lblue, glyph: '≈', label: 'Inundação', alarm: true },
  birth: { color: C.lgreen, glyph: '♥', label: 'Nascimento' },
}
export const eventLook = (t: string) => EVENT_LOOK[t] ?? { color: C.lgray, glyph: '·', label: t }

export const HAPPINESS: Record<string, { pt: string; color: string; face: string }> = {
  ecstatic: { pt: 'Extasiado', color: C.lcyan, face: '☻' },
  happy: { pt: 'Feliz', color: C.lgreen, face: '☺' },
  content: { pt: 'Contente', color: C.green, face: '☺' },
  unhappy: { pt: 'Infeliz', color: C.yellow, face: '☹' },
  miserable: { pt: 'Miserável', color: C.lred, face: '☹' },
  'tantrum-prone': { pt: 'À beira da birra', color: C.red, face: '☹' },
}

export const PROFESSIONS = ['Miner', 'Mason', 'Carpenter', 'Brewer', 'Farmer', 'Fisherdwarf', 'Woodcutter', 'Metalsmith',
  'Gem Cutter', 'Engraver', 'Mechanic', 'Doctor', 'Hammerdwarf', 'Axedwarf', 'Legendary Cheesemaker']

// The dwarven calendar: 12 months of 28 days, named after stones.
const MONTHS = ['Granite', 'Slate', 'Felsite', 'Hematite', 'Malachite', 'Galena', 'Limestone', 'Sandstone', 'Timber',
  'Moonstone', 'Opal', 'Obsidian']
const SEASONS = ['Primavera', 'Verão', 'Outono', 'Inverno']
export function dwarfDate(d = new Date()) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  const dayOfYear = Math.floor((d.getTime() - start) / 86_400_000)
  const m = Math.min(11, Math.floor((dayOfYear / 365) * 12))
  const day = Math.floor(((dayOfYear / 365) * 12 - m) * 28) + 1
  return { day, month: MONTHS[m], season: SEASONS[Math.floor(m / 3)], year: d.getUTCFullYear() - 1775 }
}
export const ordinal = (n: number) => `${n}º`

/** Deterministic string hash, used to seed procedural sprites. */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
