export const CARE_TASKS = [
  { type: 'watered',    field: 'water_interval_days',     weight: 3, icon: 'Droplets' },
  { type: 'pruned',     field: 'prune_interval_days',      weight: 1, icon: 'Scissors' },
  { type: 'fertilized', field: 'fertilize_interval_days',  weight: 2, icon: 'Sprout' },
  { type: 'harvested',  field: 'harvest_interval_days',    weight: 1, icon: 'Wheat' },
]

export function computeHealth(plant, latestLogs = {}) {
  const overdueTypes = []
  let score = 0
  for (const { type, field, weight } of CARE_TASKS) {
    if (!plant[field]) continue
    const last = latestLogs[type] ?? plant.date_planted ?? plant.created_at
    if (!last) continue
    const daysSince = (Date.now() - new Date(last)) / 86_400_000
    if (daysSince > plant[field]) {
      overdueTypes.push(type)
      score += weight
    }
  }
  const status = score === 0 ? 'healthy' : score <= 3 ? 'attention' : 'critical'
  return { status, overdueTypes, score }
}
