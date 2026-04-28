// Plant-specific Amazon-search affiliate recommendations.
// Tag is optional via VITE_AMAZON_TAG. Without it, links still work — no commission.

export function amazonSearch(query) {
  const tag = import.meta.env.VITE_AMAZON_TAG ?? ''
  const params = new URLSearchParams({ k: query })
  if (tag) params.set('tag', tag)
  return `https://www.amazon.com/s?${params.toString()}`
}

function universalRecs(plant) {
  const name = plant.name
  return [
    { id: 'fertilizer',   category: 'Care',  title: 'Fertilizer',   blurb: `${name} fertilizer`,   icon: 'flask',     query: `${name} fertilizer` },
    { id: 'pest-control', category: 'Care',  title: 'Pest control', blurb: `${name} pest control`, icon: 'bug',       query: `${name} pest control` },
    { id: 'watering-can', category: 'Tools', title: 'Watering can', blurb: 'Garden watering can',  icon: 'droplets',  query: 'garden watering can' },
    { id: 'gloves',       category: 'Tools', title: 'Gloves',       blurb: 'Gardening gloves',     icon: 'hand',      query: 'gardening gloves' },
  ]
}

const VINE_FAMILIES = new Set(['Cucurbitaceae'])
const POLE_BEAN_IDS = new Set(['pole-bean', 'green-bean'])
const BERRY_IDS     = new Set(['strawberry', 'blueberry', 'raspberry', 'blackberry'])
const CAGE_FAMILIES = new Set(['Solanaceae'])

function conditionalRecs(plant) {
  const out = []
  if (plant.prune_interval_days != null) {
    out.push({ id: 'pruners', category: 'Tools', title: 'Pruners', blurb: 'Pruning shears', icon: 'scissors', query: 'pruning shears' })
  }
  if (VINE_FAMILIES.has(plant.plant_family) || POLE_BEAN_IDS.has(plant.id)) {
    out.push({ id: 'trellis', category: 'Tools', title: 'Trellis', blurb: 'Garden trellis', icon: 'square', query: 'garden trellis' })
  }
  if (CAGE_FAMILIES.has(plant.plant_family) && plant.category === 'vegetable') {
    out.push({ id: 'cage', category: 'Tools', title: 'Plant cage', blurb: 'Cage / stake support', icon: 'square', query: 'tomato cage' })
  }
  if (BERRY_IDS.has(plant.id)) {
    out.push({ id: 'netting', category: 'Tools', title: 'Bird netting', blurb: 'Protect your harvest', icon: 'square', query: 'bird netting for berries' })
  }
  return out
}

const ROSACEAE_TREES = new Set(['apple', 'pear', 'peach', 'plum'])

function problemSolverRecs(plant) {
  const out = []
  if (plant.plant_family === 'Ericaceae') {
    out.push({ id: 'acidic-soil', category: 'Problem-solving', title: 'Acidic soil', blurb: 'Soil acidifier for blueberries', icon: 'beaker', query: 'soil acidifier blueberry' })
  }
  if (plant.plant_family === 'Solanaceae') {
    out.push({ id: 'blossom-end-rot', category: 'Problem-solving', title: 'Blossom end rot', blurb: 'Calcium spray', icon: 'alert', query: 'calcium spray blossom end rot' })
  }
  if (plant.plant_family === 'Cucurbitaceae') {
    out.push({ id: 'powdery-mildew', category: 'Problem-solving', title: 'Powdery mildew', blurb: 'Neem oil spray', icon: 'leaf', query: 'neem oil powdery mildew' })
  }
  if (plant.plant_family === 'Rosaceae' && ROSACEAE_TREES.has(plant.id)) {
    out.push({ id: 'dormant-oil', category: 'Problem-solving', title: 'Dormant oil', blurb: 'Fruit tree spray', icon: 'spray', query: 'dormant oil fruit tree spray' })
  }
  return out
}

export function getRecommendationsForPlant(plant) {
  if (!plant) return []
  const combined = [...universalRecs(plant), ...conditionalRecs(plant), ...problemSolverRecs(plant)]
  const seen = new Set()
  return combined.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)))
}
