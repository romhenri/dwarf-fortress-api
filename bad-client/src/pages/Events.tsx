import { useEffect, useState } from 'react'
import { get } from '../api'

export default function Events() {
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    get('/events/random').then(setEvent)
  }, [])

  return (
    <div>
      <h1>Eventos ao vivo</h1>
      <p>Tudo o que acontece na sua fortaleza, em tempo real.</p>
      {event && (
        <div className="event">
          <strong>{event.type}</strong>
          <p>{event.message}</p>
          <small>{event.at}</small>
        </div>
      )}
      <p className="footer"><a href="/">início</a></p>
    </div>
  )
}
