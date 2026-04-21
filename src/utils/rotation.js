const SEASON_ORDER = ['spring', 'summer', 'fall', 'winter']

function seasonsBetween(s1, y1, s2, y2) {
  const a = y1 * 4 + SEASON_ORDER.indexOf(s1)
  const b = y2 * 4 + SEASON_ORDER.indexOf(s2)
  return Math.abs(b - a)
}

export function checkRotationConflict(bedId, plantFamily, season, year, allAssignments) {
  if (!plantFamily) return { hasConflict: false }
  const prior = allAssignments.filter(a =>
    a.bed_id === bedId &&
    a.plant_family === plantFamily &&
    !(a.season === season && a.year === year)
  )
  if (prior.length === 0) return { hasConflict: false }
  const sorted = prior.sort((a, b) => {
    const aIdx = a.year * 4 + SEASON_ORDER.indexOf(a.season)
    const bIdx = b.year * 4 + SEASON_ORDER.indexOf(b.season)
    return bIdx - aIdx
  })
  const latest = sorted[0]
  const gap = seasonsBetween(latest.season, latest.year, season, year)
  if (gap <= 3) {
    return { hasConflict: true, lastSeenSeason: latest.season, lastSeenYear: latest.year, plantFamily }
  }
  return { hasConflict: false }
}
