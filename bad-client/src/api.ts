export async function get(path: string) {
  const res = await fetch(`/api${path}`)
  return res.json()
}

export async function post(path: string, body: unknown) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function del(path: string) {
  await fetch(`/api${path}`, { method: 'DELETE' })
}
