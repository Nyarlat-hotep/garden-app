import { FOOD_PLANTS } from './foodPlants'
import { FLOWERS } from './flowers'

export const ALL_PLANTS = [...FOOD_PLANTS, ...FLOWERS]

export function searchPlants(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return ALL_PLANTS.filter(p =>
    p.common_name.toLowerCase().includes(q) ||
    (p.scientific_name && p.scientific_name.toLowerCase().includes(q)) ||
    p.category.toLowerCase().includes(q) ||
    (p.plant_family && p.plant_family.toLowerCase().includes(q))
  )
}

export function getPlantsByCategory(category) {
  return ALL_PLANTS.filter(p => p.category === category)
}
