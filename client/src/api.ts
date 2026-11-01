import { useEffect, useState, useSyncExternalStore } from 'react'

export type Page<T> = { total: number; limit: number; offset: number; items: T[] }
export type Biome = { id: number; name: string; savagery: 'calm' | 'wild' | 'savage'; alignment: 'good' | 'neutral' | 'evil' }
export type Creature = { id: number; name: string; biome: string; hostile: number; size: number; description: string }
export type Animal = { id: number; name: string; biome: string; tameable: number; trainable: number; pet_value: number; product: string | null }
export type Ore = { id: number; name: string; metal: string; value: number; environment: string }
export type Gem = { id: number; name: string; color: string; value: number; rarity: 'common' | 'uncommon' | 'rare' | 'legendary' }
export type Metal = { metal: string; ore_count: number; value: number }
export type Inhabitants = Biome & { creatures: Creature[]; animals: Animal[] }
export type Dwarf = { name: string; age: number; profession: string; happiness: string }
export type GameEvent = { type: string; message: string; at: string }
export type Stats = {
  creatures: number; hostile_creatures: number; animals: number; tameable_animals: number; ores: number
  metals: number; gems: number; biomes: number
  largest_creature: { name: string; size: number }; most_valuable_gem: { name: string; value: number }
}
export type SearchResult = { creatures: Creature[]; animals: Animal[]; ores: Ore[]; gems: Gem[]; biomes: Biome[] }

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = body?.detail
    const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d) => d.msg).join('; ') : res.statusText
    throw new ApiError(res.status, msg)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const get = <T>(path: string) => request<T>(path)
export const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const del = (path: string) => request<void>(path, { method: 'DELETE' })

// ponytail: in-memory stale-while-revalidate cache, swap for TanStack Query if needs grow (retries, mutations)
type Entry = { data?: unknown; error?: Error; promise?: Promise<unknown>; at: number }
const cache = new Map<string, Entry>()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const STALE_MS = 60_000

function load(path: string) {
  const entry = cache.get(path) ?? { at: 0 }
  if (entry.promise) return
  entry.promise = request(path)
    .then((data) => Object.assign(entry, { data, error: undefined, at: Date.now() }))
    .catch((error) => Object.assign(entry, { error, at: Date.now() }))
    .finally(() => {
      entry.promise = undefined
      notify()
    })
  cache.set(path, entry)
}

/** Drop every cached path starting with prefix and refetch the ones on screen. */
export function invalidate(prefix: string) {
  for (const [key, e] of cache) if (key.startsWith(prefix)) e.at = 0
  notify()
}

export function useApi<T>(path: string | null) {
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => (path ? cache.get(path) : undefined)?.at ?? 0,
  )
  const entry = path ? cache.get(path) : undefined
  useEffect(() => {
    if (path && (!entry || Date.now() - entry.at > STALE_MS)) load(path)
  })
  return {
    data: entry?.data as T | undefined,
    error: entry?.error,
    loading: !!path && !entry?.data && !entry?.error,
  }
}

/** Uncached fetch for endpoints that answer differently every time (random creature, dwarves, events). */
export function useFresh<T>(path: string) {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true }))
    request<T>(path).then(
      (data) => live && setState({ data, loading: false }),
      (error) => live && setState({ error, loading: false }),
    )
    return () => {
      live = false
    }
  }, [path, nonce])
  return { ...state, reroll: () => setNonce((n) => n + 1) }
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export const qs = (params: Record<string, string | number | null | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) p.set(k, String(v))
  return p.toString()
}
