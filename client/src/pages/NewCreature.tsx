import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, invalidate, post, useApi, useDebounced, type Biome, type Creature } from '../api'
import { DWARF_SIZE, biomeLook, num } from '../df'
import { creatureSprite } from '../sprites'
import { PageHead, Panel, Sprite } from '../ui'

export default function NewCreature() {
  const navigate = useNavigate()
  const biomes = useApi<Biome[]>('/biomes')
  const [form, setForm] = useState({ name: '', biome: 'caverns', hostile: true, size: 650000, description: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const previewName = useDebounced(form.name.trim() || 'Unnamed Horror', 250)
  const look = biomeLook(form.biome)
  const field = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const created = await post<Creature>('/creatures', { ...form, name: form.name.trim() })
      invalidate('/creatures')
      invalidate('/stats')
      invalidate('/biomes/')
      navigate(`/creatures/${created.id}`)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409
        ? `Já existe uma criatura chamada “${form.name.trim()}” (ou o bioma não existe).`
        : err instanceof ApiError ? `A API recusou: ${err.message}` : 'Sem conexão com a API. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead glyph="+" title="Registrar criatura">
        Algo novo saiu das cavernas? Descreva para os arquivistas. Nomes sem arte própria ganham uma forma procedural, como as feras esquecidas do jogo.
      </PageHead>
      <nav className="crumbs" aria-label="Trilha"><Link to="/creatures">Bestiário</Link> <span aria-hidden>►</span> Registrar</nav>
      <div className="detail">
        <div className="detail-art" style={{ background: `linear-gradient(${look.sky}, ${look.bg} 70%, ${look.ground})` }}>
          <Sprite grid={creatureSprite(previewName)} size={224} className="idle" label={`Prévia de ${previewName}`} />
          <p className="art-note">Prévia ao vivo: mude o nome e a fera muda.</p>
        </div>
        <Panel title="Ficha" className="sheet">
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span>Nome *</span>
              <input required maxLength={80} value={form.name} onChange={(e) => field('name')(e.target.value)} placeholder="Blind Cave Ogre" />
            </label>
            <label className="field">
              <span>Bioma *</span>
              <select required value={form.biome} onChange={(e) => field('biome')(e.target.value)} disabled={!biomes.data}>
                {(biomes.data ?? [{ id: 0, name: form.biome } as Biome]).map((b) => (
                  <option key={b.name} value={b.name}>{biomeLook(b.name).glyph} {biomeLook(b.name).pt}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Volume (cm³) *</span>
              <input required type="number" min={1} step={1} value={form.size || ''}
                onChange={(e) => field('size')(e.target.valueAsNumber || 0)} />
              <small className="muted">{form.size > 0 ? `≈ ${num(Math.max(0.01, +(form.size / DWARF_SIZE).toFixed(2)))} anões de volume` : 'Precisa ser maior que zero.'}</small>
            </label>
            <fieldset className="seg">
              <legend>Disposição</legend>
              <button type="button" aria-pressed={form.hostile} className={form.hostile ? 'on' : ''} onClick={() => field('hostile')(true)}>‼ Hostil</button>
              <button type="button" aria-pressed={!form.hostile} className={!form.hostile ? 'on' : ''} onClick={() => field('hostile')(false)}>☺ Pacífica</button>
            </fieldset>
            <label className="field">
              <span>Descrição</span>
              <textarea maxLength={500} rows={4} value={form.description} onChange={(e) => field('description')(e.target.value)}
                placeholder="Lives in the third cavern layer." />
              <small className="muted">{form.description.length}/500</small>
            </label>
            {error && <p className="form-error" role="alert">☠ {error}</p>}
            <div className="actions">
              <button className="btn btn-gold" disabled={busy || !form.name.trim() || form.size <= 0}>{busy ? 'Gravando…' : '☼ Gravar no bestiário'}</button>
              <Link className="btn" to="/creatures">Cancelar</Link>
            </div>
          </form>
        </Panel>
      </div>
    </>
  )
}
