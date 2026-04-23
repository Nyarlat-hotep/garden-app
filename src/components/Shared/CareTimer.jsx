import { useEffect, useState } from 'react'

const DAY_MS = 86_400_000

function format(ms) {
  const abs = Math.abs(ms)
  const d = Math.floor(abs / DAY_MS)
  const h = Math.floor((abs % DAY_MS) / 3_600_000)
  const m = Math.floor((abs % 3_600_000) / 60_000)
  const s = Math.floor((abs % 60_000) / 1_000)
  const pad = n => String(n).padStart(2, '0')
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`
  if (m > 0) return `${pad(m)}m ${pad(s)}s`
  return `${s}s`
}

export default function CareTimer({ plant, latestLogs, field, type }) {
  const interval = plant?.[field]
  const last = latestLogs?.[type] ?? plant?.date_planted ?? plant?.created_at

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!interval || !last) return null

  const dueAt   = new Date(last).getTime() + interval * DAY_MS
  const ms      = dueAt - now
  const overdue = ms < 0
  const state   = overdue ? 'overdue' : ms < 43_200_000 ? 'due' : 'upcoming'

  return (
    <span className={`care-timer care-timer--${state}`}>
      {overdue && <span className="care-timer-sign">-</span>}
      {format(ms)}
    </span>
  )
}
