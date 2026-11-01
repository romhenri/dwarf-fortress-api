// Original pixel art in the spirit of Dwarf Fortress. Every sprite is a 16x16 grid of palette keys.
// '.' is transparent. Rows of 8 chars are mirrored into 16 (front-facing, symmetric sprites).
// Layers stack: later layers paint over earlier ones; '.' keeps what is below, '_' erases it.
import { GEM_COLOR, METAL_COLOR, hash, rng } from './df.ts'

export type Grid = (string | null)[][]
type Pal = Record<string, string>
type Layer = string[]

const OUT = '#1b1410'
const BASE: Pal = { k: OUT, w: '#f4ecd8', e: '#ff3b2f', E: '#ffe14a', y: '#e8d8a8', x: '#0d0a08' }

function expand(rows: Layer): string[] {
  return rows.map((r) => (r.length === 8 ? r + [...r].reverse().join('') : r.padEnd(16, '.')))
}

export function compose(layers: Layer[], pal: Pal): Grid {
  const p = { ...BASE, ...pal }
  const grid: Grid = Array.from({ length: 16 }, () => Array(16).fill(null))
  for (const layer of layers) {
    expand(layer).forEach((row, y) => {
      for (let x = 0; x < 16; x++) {
        const ch = row[x]
        if (ch === '.' || ch === undefined) continue
        grid[y][x] = ch === '_' ? null : (p[ch] ?? null)
      }
    })
  }
  return grid
}

/** Pad a layer that only describes the top rows. */
const top = (rows: Layer): Layer => [...rows, ...Array(16 - rows.length).fill('........')]
/** Pad a layer that only describes the bottom rows. */
const bottom = (rows: Layer): Layer => [...Array(16 - rows.length).fill('........'), ...rows]

// ---------------------------------------------------------------- humanoids (front view, mirrored)

const BODY = bottom([
  '..kkcccc',
  '.kcccccc',
  'kskcCccc',
  'kskcCccc',
  'kskbbbbb',
  '.k.kcccc',
  '...kccck',
  '...kddk.',
  '..kdddk.',
])

const HEADS: Record<string, Layer> = {
  goblin: top(['........', '........', 'k..kkkkk', 'kskSssss', '.kksssss', '..kssess', '..ksSsss', '...ksskw', '....kkkk']),
  kobold: top(['........', '........', '........', '...k..kk', '...kkkss', '..ksssss', '..kseess', '..kssssS', '...kkSSS']),
  elf: top(['........', '....kkkk', '...khhhh', 'k.khhhhs', 'kskhssss', '.kkhsess', '..khssss', '..khkSss', '..kh.kkk']),
  troll: top(['........', '...kkkkk', '..khhhhh', '.khhhhhh', '.kSSSSSS', '.ksesSss', '.kssssss', '.kswkkkk', '..kkkwww']),
  cyclops: top(['........', '....kkkk', '...khhhh', '..ksssss', '..kssxxx', '..kssxEE', '..ksssxx', '..ksskkk', '...kssss']),
  minotaur: top(['w.......', 'wk......', 'kwk.kkkk', '.kwkhhhh', '..khhhhh', '..khehhh', '..khhhHH', '...khHkH', '...khHHH']),
  werebeast: top(['........', '..kk....', '..khk.kk', '..khhkhh', '..khhhhh', '..khhehh', '...khhhH', '....khkx', '....kwkk']),
  colossus: top(['......kE', '....kkkE', '...kmmmm', '..kmMmmm', '..kmxxxx', '..kmmEmm', '..kmmmmm', '...kmmkk', '...kmmmm']),
  ettin: top(['........', '.kkkk...', 'khhhhk..', 'ksessk..', 'kssssk..', 'kswwsk..', '.kkkk...', '..ss....', '..ss....']),
}

const humanoid = (head: string, pal: Pal) => compose([BODY, HEADS[head]], pal)

// ---------------------------------------------------------------- side-view beasts (facing right)

const QUAD: Layer = [
  '................',
  '................',
  '................',
  '...........kk...',
  '..........kbbk..',
  '..........kbebk.',
  '..kkkkkkkkbbbbbk',
  '.kbbbbbbbbbbkkk.',
  'kbkbbbbbbbbbk...',
  'k.kbbbbbbbbbk...',
  '..kbBBBBBBBbk...',
  '..kbkbkkkkbkbk..',
  '..kbkbk..kbkbk..',
  '..kbkbk..kbkbk..',
  '..kdkdk..kdkdk..',
  '................',
]

const SMALL: Layer = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..........k.k...',
  '..........kbkbk.',
  '.k........kbebk.',
  'kbk.kkkkkkbbbbbk',
  '.kbkbbbbbbbbkkk.',
  '..kbbbbbbbbbk...',
  '..kbBBBBBBBbk...',
  '..kbkbk.kbkbk...',
  '..kdkdk.kdkdk...',
  '................',
]

const BIRD: Layer = [
  '................',
  '................',
  '................',
  '................',
  '..........kkk...',
  '.........kbbbk..',
  '.........kbebyk.',
  '.........kbbkyy.',
  '.kk.....kbbbk...',
  'kbbk...kbbbbk...',
  '.kbbkkkbbBbbk...',
  '..kbbbbbBBbk....',
  '...kbbbbbbk.....',
  '....kkdkdk......',
  '......d.d.......',
  '.....dd.dd......',
]

const ANIMAL_PARTS: Record<string, Layer> = {
  horns: top(['................', '................', '...........w.w..', '...........kwk..']),
  longhorn: top(['................', '................', '.........ww...ww', '..........wwkww.']),
  mane: top(['................', '................', '................', '..........hh....', '.........hhh....', '.........hh.....', '.........h......']),
  wool: top(['', '', '', '', '', '', '..kkkkkkkk......', '.khwhwhwhwh.....', 'kkwhwhwhwhwk....', '..khwhwhwhwk....', '..kwhwhwhwhk....']),
  hump: top(['', '', '', '', '....kkk.........', '...kbbbk........', '..kbbbbbk.......']),
  neck: top(['', '..........kk....', '.........kbbk...', '.........kbebk..', '.........kbbbbk.', '.........kbbkkk.', '.........kbk....']),
  trunk: top(['', '', '', '', '', '', '', '', '...............k', '..............kb', '..............kb', '..............kb', '...............k']),
  ears: top(['', '', '', '', '', '........kk......', '.......kbbk.....', '.......kbbk.....', '........kk......']),
  bigear: top(['', '', '', '', '.........kk.....', '........kBBk....', '........kBBk....', '........kBBk....', '.........kk.....']),
  snout: top(['', '', '', '', '', '', '', '', '', '...............x']),
  comb: top(['', '', '', '..........eek...', '..........e.....']),
  wattle: top(['', '', '', '', '', '', '', '..............e.', '..............ee']),
  stripes: top(['', '', '', '', '', '', '', '...k...k...', '....k...k..']),
  tail: top(['', '', '', '', '', '', '', '', 'k...............', 'k...............', '_...............']),
  spots: top(['', '', '', '', '', '', '', '....ww...ww.', '..ww...ww...', '.....ww....']),
  talon: bottom(['.....yy.yy......']),
  eagle: top(['', '', '', '', '', '', '', '', '.kk.......', 'kbbkk.....', 'kbbbbk....', '.kbbbbk...']),
}

const CROC: Layer = [
  '................', '................', '................', '................', '................',
  '................', '................', '................', '................',
  '...........kk...', '..kkkkkkkkkbekkk', 'kkbbbbbbbbbbbbbk', '.kkBBBBBBBBkwkwk', '..kbk.kbk.kbkk..',
  '..kdk.kdk.kdk...', '................',
]

const CREATURES: Record<string, () => Grid> = {
  dragon: () => compose([[
    '................',
    '....kk..........',
    '...kwwk.........',
    '..kwWWwk....kkk.',
    '..kwWWWwk..krrek',
    '...kwWWWwkkrrrrk',
    '....kwWWwrrrkkyk',
    '..kk.kwwrrrk....',
    '.krrk.krrrrk....',
    'krkkrkrrRRrrk...',
    'kk..krrrRRRrrk..',
    '....krrrRRRrrk..',
    '.....krrrrrrrk..',
    '......krkkkrk...',
    '......krk.krk...',
    '.....kyyk.kyyk..',
  ]], { r: '#c43a2a', R: '#f0b04a', w: '#7a1f1a', W: '#e05a3a', e: '#ffe14a' }),
  hydra: () => compose([[
    '..kk......kk....',
    '.kgek....kgek...',
    '.kggyk..kggyk.kk',
    '..kgk....kgk.kgek',
    '..kgk.kk.kgk.kggy',
    '..kgkkgek.kgkkgk',
    '...kgkggy.kgkgk.',
    '...kgkkgk.kggk..',
    '....kgggkkgggk..',
    '....kgGGGGGgk...',
    '...kgGGGGGGGgk..',
    '..kgGGGGGGGGgk..',
    '.kgggggggggggk..',
    'kgkkgkkkkkgkk...',
    'k...gk...gk.....',
    '...kyyk.kyyk....',
  ]], { g: '#4a8a3a', G: '#9ccf5a', e: '#ffe14a' }),
  roc: () => compose([[
    '................',
    'kk..........kk..',
    'kbkk.......kbek.',
    '.kbbkk....kbbbyy',
    '.kbbbbkk..kbbkyy',
    '..kbBbbbkkbbbk..',
    '..kbBBbbbbbbk...',
    '...kbBBbbbbbk...',
    '....kbbbbbbbk...',
    '.....kbbBBbk....',
    '......kbbbk.....',
    '.......kdkd.....',
    '.......kdkd.....',
    '......yy.yy.....',
    '................',
    '................',
  ]], { b: '#7a5a3a', B: '#c9a06a', d: '#e8b84a' }),
  carp: () => compose([[
    '................',
    '................',
    '................',
    '........kk......',
    '.......kffk.....',
    'kk...kkffffkkk..',
    'kfk.kffffffffek.',
    'kffkffFFFFFffffk',
    '.kffffFFFFFffwwk',
    'kffkffFFFFFffkk.',
    'kfk.kffffffffk..',
    'kk...kkffffkkk..',
    '.......kffk.....',
    '........kk......',
    '................',
    '................',
  ]], { f: '#e8792a', F: '#ffc04a', e: '#0d0a08' }),
  spider: () => compose([top([
    '........',
    '........',
    'k.......',
    '.k...kkk',
    '..k.kssS',
    'kk.kssss',
    '..kkkssS',
    'kkk.kses',
    '...kkkss',
    '..k..kks',
    '.k..k.kk',
    'k..k..ky',
    '..k.....',
  ])], { s: '#5a4a6a', S: '#8a6aa0', e: '#ff3b2f' }),
  goblin: () => humanoid('goblin', { s: '#6aa03a', S: '#4a7a2a', c: '#4a3a2a', C: '#2a2018', b: '#7a1f1a', d: '#2a2018' }),
  kobold: () => humanoid('kobold', { s: '#a0905a', S: '#7a6a3a', c: '#5a4a2a', C: '#3a2a18', b: '#3a2a18', d: '#3a2a18' }),
  elf: () => humanoid('elf', { s: '#f0c8a0', S: '#d0a07a', h: '#f0e06a', c: '#3a8a3a', C: '#2a5a2a', b: '#9c6a2f', d: '#5a3a1a' }),
  troll: () => humanoid('troll', { s: '#7a8a6a', S: '#5a6a4a', h: '#4a3a2a', c: '#5a4a3a', C: '#3a2a1a', b: '#2a1a0a', d: '#3a2a1a' }),
  cyclops: () => humanoid('cyclops', { s: '#d0a07a', S: '#a07a5a', h: '#5a3a1a', c: '#8a6a3a', C: '#5a4a2a', b: '#3a2a18', d: '#3a2a18' }),
  minotaur: () => humanoid('minotaur', { s: '#7a4a2a', h: '#7a4a2a', H: '#4a2a1a', c: '#5a3a2a', C: '#3a2018', b: '#c9a04a', d: '#2a1a0a', e: '#ff3b2f' }),
  werebeast: () => humanoid('werebeast', { s: '#6a5a4a', h: '#6a5a4a', H: '#4a3a2a', c: '#5a4a3a', C: '#3a2a1a', b: '#2a1a0a', d: '#2a1a0a', e: '#ffe14a' }),
  'bronze colossus': () => humanoid('colossus', { s: '#c98a3a', m: '#c98a3a', M: '#f0c06a', c: '#a86a2a', C: '#7a4a1a', b: '#f0c06a', d: '#7a4a1a', E: '#ffe14a' }),
  ettin: () => humanoid('ettin', { s: '#a08a7a', S: '#7a6a5a', h: '#3a2a1a', c: '#6a5a4a', C: '#4a3a2a', b: '#2a1a0a', d: '#2a1a0a' }),
}

const ANIMALS: Record<string, () => Grid> = {
  cat: () => compose([SMALL, ANIMAL_PARTS.tail, ANIMAL_PARTS.stripes], { b: '#d08a3a', B: '#f0c080', e: '#6cdc4a' }),
  dog: () => compose([SMALL, ANIMAL_PARTS.tail, ANIMAL_PARTS.snout], { b: '#9c6a3a', B: '#d0a070', e: '#0d0a08' }),
  pig: () => compose([SMALL, ANIMAL_PARTS.snout], { b: '#f0a0a0', B: '#ffc8c8', e: '#0d0a08', x: '#c06a6a' }),
  'mole dog': () => compose([SMALL, ANIMAL_PARTS.snout], { b: '#d8b0a0', B: '#f0d0c0', e: '#0d0a08', x: '#e08080' }),
  goat: () => compose([SMALL, ANIMAL_PARTS.horns], { b: '#e0d8c8', B: '#fffaf0', e: '#0d0a08' }),
  horse: () => compose([QUAD, ANIMAL_PARTS.mane, ANIMAL_PARTS.tail], { b: '#8a5a2a', B: '#a87a4a', h: '#2a1a0a', e: '#0d0a08' }),
  cow: () => compose([QUAD, ANIMAL_PARTS.horns, ANIMAL_PARTS.spots], { b: '#3a2a1a', B: '#f0e8d8', e: '#0d0a08' }),
  yak: () => compose([QUAD, ANIMAL_PARTS.longhorn, ANIMAL_PARTS.mane], { b: '#4a3a2a', B: '#6a5a4a', h: '#2a1a0a', e: '#0d0a08' }),
  sheep: () => compose([QUAD, ANIMAL_PARTS.wool], { b: '#3a3a3a', B: '#3a3a3a', h: '#f0ece0', w: '#ffffff', e: '#ffe14a' }),
  alpaca: () => compose([QUAD, ANIMAL_PARTS.neck, ANIMAL_PARTS.wool], { b: '#c8a070', B: '#c8a070', h: '#e8c890', w: '#f0d8a8', e: '#0d0a08' }),
  llama: () => compose([QUAD, ANIMAL_PARTS.neck, ANIMAL_PARTS.ears], { b: '#e8e0d0', B: '#d0c8b8', e: '#0d0a08' }),
  camel: () => compose([QUAD, ANIMAL_PARTS.hump, ANIMAL_PARTS.neck], { b: '#c89a5a', B: '#e0b87a', e: '#0d0a08' }),
  elephant: () => compose([QUAD, ANIMAL_PARTS.bigear, ANIMAL_PARTS.trunk], { b: '#8a8a90', B: '#a0a0a8', e: '#0d0a08' }),
  'polar bear': () => compose([QUAD], { b: '#f4f4f0', B: '#d8d8d0', e: '#0d0a08' }),
  chicken: () => compose([BIRD, ANIMAL_PARTS.comb, ANIMAL_PARTS.wattle], { b: '#f4ecd8', B: '#d8ccb0', d: '#e8a83a', y: '#e8a83a' }),
  turkey: () => compose([BIRD, ANIMAL_PARTS.wattle], { b: '#5a3a2a', B: '#8a5a3a', d: '#c08a4a', y: '#c08a4a' }),
  'giant eagle': () => compose([BIRD, ANIMAL_PARTS.eagle], { b: '#5a3a1a', B: '#8a6a3a', d: '#e8b83a', y: '#ffd23b' }),
  crocodile: () => compose([CROC], { b: '#4a6a2a', B: '#8a9a4a', e: '#ffe14a', d: '#2a3a1a' }),
}

// ---------------------------------------------------------------- items

const GEM: Layer = top([
  '........',
  '........',
  '...kkkkk',
  '..kLwLLL',
  '.kLLwLgg',
  'kggggggg',
  'kgGgggGg',
  '.kgGggGg',
  '..kgGgGg',
  '...kgGgg',
  '....kgGg',
  '.....kgg',
  '......kg',
  '.......k',
])

const BOULDER: Layer = [
  '................', '................', '................', '................',
  '......kkkkk.....', '....kkrrrrRkk...', '...krrmrrRRRrk..', '..krrrrrmrrRRrk.',
  '..krmrrrrrrrRrk.', '.krrrrrmmrrrrrk.', '.krrrmrrrrrmrrk.', '.kSrrrrrrrrrrSk.',
  '..kSSrrrmrrSSk..', '...kkSSSSSSkk...', '.....kkkkkk.....', '................',
]

const INGOT: Layer = [
  '................', '................', '................', '................',
  '................', '................', '.....kkkkkkk....', '....kLLLLLLLk...',
  '...kLmmmmmmLLk..', '..kmmmmmmmmmLk..', '.kmmmmmmmmmmmk..', '.kMmmmmmmmmmMk..',
  '..kMMMMMMMMMMk..', '...kkkkkkkkkk...', '................', '................',
]

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)))
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`
}

export const gemSprite = (color: string) => {
  const g = GEM_COLOR[color] ?? '#cccccc'
  return compose([GEM], { g, G: shade(g, 0.62), L: shade(g, 1.45) })
}

const ROCK: Record<string, string> = { sedimentary: '#8a7a5a', igneous: '#5a5058', metamorphic: '#6a6a72', vein: '#4a4038' }
export const oreSprite = (metal: string, environment: string) => {
  const r = ROCK[environment] ?? '#6a6a6a'
  return compose([BOULDER], { r, R: shade(r, 1.3), S: shade(r, 0.7), m: METAL_COLOR[metal] ?? '#fff' })
}

export const ingotSprite = (metal: string) => {
  const m = METAL_COLOR[metal] ?? '#bbbbbb'
  return compose([INGOT], { m, L: shade(m, 1.3), M: shade(m, 0.65) })
}

export const PICK: Grid = compose([[
  '................', '....kkkkk.......', '...kwwwwwk......', '..kwkkkkwwk.....', '..kk...kbkwk....',
  '.......kbk.kk...', '......kbk.......', '.....kbk........', '....kbk.........', '...kbk..........',
  '..kbk...........', '.kbk............', '.kk.............', '................', '................', '................',
]], { w: '#c8ccd4', b: '#9c6a2f' })

// ---------------------------------------------------------------- procedural

/** Symmetric random monster, the way the game invents forgotten beasts. Same name, same beast. */
export function beastSprite(name: string): Grid {
  const r = rng(hash(name))
  const hue = Math.floor(r() * 360)
  const body = `hsl(${hue} 55% 45%)`
  const light = `hsl(${hue} 60% 65%)`
  const accent = `hsl(${(hue + 150) % 360} 80% 60%)`
  const half: number[][] = Array.from({ length: 14 }, (_, y) =>
    Array.from({ length: 7 }, (_, x) => {
      const centerBias = (x + 1) / 7
      const v = r()
      if (v < 0.42 * centerBias + (y > 2 && y < 12 ? 0.18 : 0)) return v < 0.08 ? 2 : 1
      return 0
    }),
  )
  half[4][5] = 3
  half[4][6] = 1
  const grid: Grid = Array.from({ length: 16 }, () => Array(16).fill(null))
  for (let y = 0; y < 14; y++)
    for (let x = 0; x < 7; x++) {
      const v = half[y][x]
      const c = v === 1 ? (y > 8 ? body : r() < 0.25 ? light : body) : v === 2 ? accent : v === 3 ? BASE.e : null
      grid[y + 1][x + 1] = c
      grid[y + 1][14 - x] = c
    }
  return outline(grid)
}

function outline(g: Grid): Grid {
  const out = g.map((r) => [...r])
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if (g[y][x]) continue
      const n = [g[y - 1]?.[x], g[y + 1]?.[x], g[y][x - 1], g[y][x + 1]]
      if (n.some(Boolean)) out[y][x] = OUT
    }
  return out
}

const BEARD = ['#c43a1a', '#e8a83a', '#5a3a1a', '#2a1a0a', '#bfbfbf', '#f0f0e8', '#8a4a1a']
const SKIN = ['#f0c8a0', '#d8a07a', '#a8704a', '#7a4a2a']
const CLOTH: Record<string, string> = {
  Miner: '#7a6a5a', Mason: '#8a8a8a', Carpenter: '#9c6a2f', Brewer: '#b0302a', Farmer: '#5a8a2a', Fisherdwarf: '#2a6a9a',
  Woodcutter: '#3a6a2a', Metalsmith: '#4a4a52', 'Gem Cutter': '#6a3a9a', Engraver: '#5a5a7a', Mechanic: '#6a5a3a',
  Doctor: '#e8e8e0', Hammerdwarf: '#7a7f8a', Axedwarf: '#7a7f8a', 'Legendary Cheesemaker': '#e8c83a',
}
const MILITARY = new Set(['Hammerdwarf', 'Axedwarf'])
const TOOL: Record<string, Layer> = {
  pick: top(['', '', '', '', '', '', '...........kkk..', '..........kwwwk.', '.............nk.', '.............n..', '.............n..', '.............n..']),
  hammer: top(['', '', '', '', '', '', '', '............kkkk', '............kwwk', '.............nk.', '.............n..', '.............n..']),
  axe: top(['', '', '', '', '', '', '', '.............kk.', '............kwwk', '............kwnk', '.............n..', '.............n..']),
  mug: top(['', '', '', '', '', '', '', '', '', '.............kkk', '.............kyk', '.............kkk']),
  gem: top(['', '', '', '', '', '', '', '', '', '..............k.', '.............kgk', '..............k.']),
}
const TOOL_OF: Record<string, string> = {
  Miner: 'pick', Mason: 'hammer', Metalsmith: 'hammer', Hammerdwarf: 'hammer', Mechanic: 'hammer', Engraver: 'hammer',
  Woodcutter: 'axe', Axedwarf: 'axe', Carpenter: 'axe', Brewer: 'mug', 'Gem Cutter': 'gem', 'Legendary Cheesemaker': 'mug',
}

const DWARF: Layer = [
  '........',
  '....kkkk',
  '...khhhh',
  '..khhhhh',
  '..khssss',
  '..kssess',
  '..kssssS',
  '..kBbbbb',
  '.kcBbbbb',
  'kscBbbbb',
  'ksckBbbb',
  'kskcBbbb',
  '.kklkBbb',
  '...kcckB',
  '...kddk.',
  '..kddkk.',
]
const HELMET: Layer = top(['....kkkk', '...kmmmm', '..kmMmmm', '..kmmmmm'])

/** A dwarf portrait that is always the same for the same name and job. */
export function dwarfSprite(name: string, profession: string): Grid {
  const r = rng(hash(name))
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const beard = pick(BEARD)
  const pal: Pal = {
    h: shade(beard, 0.85), b: beard, B: shade(beard, 0.7), s: pick(SKIN), S: '#c08a6a',
    e: '#1b1410', c: CLOTH[profession] ?? '#7a6a5a', l: '#3a2a18', d: '#3a2a18', m: '#9aa0aa', M: '#d8dce4', g: '#5cf6ff',
  }
  const layers = [DWARF]
  if (MILITARY.has(profession)) layers.push(HELMET)
  const tool = TOOL_OF[profession]
  if (tool) layers.push(TOOL[tool])
  return compose(layers, { ...pal, w: '#c8ccd4', y: '#f0d070', n: '#9c6a2f' })
}

const key = (s: string) => s.trim().toLowerCase()
export const creatureSprite = (name: string) => (CREATURES[key(name)] ?? (() => beastSprite(name)))()
export const animalSprite = (name: string) => (ANIMALS[key(name)] ?? (() => beastSprite(name)))()
export const hasArt = (name: string) => key(name) in CREATURES || key(name) in ANIMALS
