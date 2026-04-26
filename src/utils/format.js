export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(iso) {
  if (!iso) return 'Never'
  const days = Math.floor((Date.now() - new Date(iso)) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export const CATEGORY_LABELS = {
  vegetable: 'Vegetable',
  fruit: 'Fruit',
  herb: 'Herb',
  protein: 'Protein',
  flower: 'Flower',
}

export const CATEGORY_COLORS = {
  vegetable: '#7fb069',
  fruit:     '#e07b39',
  herb:      '#9ec4a0',
  protein:   '#8b5e3c',
  flower:    '#c98a9d',
}

export const ACTIVITY_LABELS = {
  watered:    'Watered',
  pruned:     'Pruned',
  fertilized: 'Fertilized',
  treated:    'Treated',
  harvested:  'Harvested',
  noted:      'Note',
}
