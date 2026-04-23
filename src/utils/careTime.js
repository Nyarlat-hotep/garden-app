const DAY_MS = 86_400_000

export function dueIn(plant, latestLogs, field, type) {
  const interval = plant?.[field]
  if (!interval) return null
  const last = latestLogs?.[type] ?? plant.date_planted ?? plant.created_at
  if (!last) return null
  const daysSince = (Date.now() - new Date(last).getTime()) / DAY_MS
  const daysUntil = interval - daysSince
  const state = daysUntil < -0.5 ? 'overdue' : daysUntil < 0.5 ? 'due' : 'upcoming'
  return { daysUntil, state }
}

export function formatDueIn(result) {
  if (!result) return null
  const { daysUntil, state } = result
  const d = Math.max(0, Math.round(Math.abs(daysUntil)))
  if (state === 'overdue') return `${d}d overdue`
  if (state === 'due')     return 'due today'
  return `in ${d}d`
}
