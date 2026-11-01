import { useState } from 'react'
import { post } from '../api'

export default function NewCreature() {
  const [form, setForm] = useState({ name: '', biome: '', hostile: true, size: '', description: '' })
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await post('/creatures', { ...form, size: Number(form.size) })
    setMessage('Criatura salva com sucesso!')
  }

  return (
    <div>
      <h1>Nova criatura</h1>
      <form onSubmit={submit}>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Bioma" value={form.biome} onChange={(e) => setForm({ ...form, biome: e.target.value })} />
        <input placeholder="Tamanho" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
        <label>
          <input
            type="checkbox"
            checked={form.hostile}
            onChange={(e) => setForm({ ...form, hostile: e.target.checked })}
          />{' '}
          Hostil
        </label>
        <textarea
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit">Salvar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
