import { useState, useMemo } from 'react'
import { Search, Droplets, Sun, Plus } from 'lucide-react'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import { CATEGORY_COLORS } from '../../utils/format.js'
import Emoji from '../Shared/Emoji.jsx'
import './DiscoverView.css'

const POPULAR = [
  'Tomato', 'Basil', 'Cucumber', 'Bell Pepper', 'Lettuce',
  'Strawberry', 'Mint', 'Carrot', 'Zucchini', 'Rosemary',
  'Spinach', 'Blueberry',
]

const CATEGORIES = ['all', 'vegetable', 'fruit', 'herb', 'protein']

export default function DiscoverView({ onAddPlant }) {
  const [query, setQuery]         = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FOOD_PLANTS.filter(p => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory
      if (!q) return matchCat
      return matchCat && (
        p.common_name.toLowerCase().includes(q) ||
        p.scientific_name.toLowerCase().includes(q)
      )
    })
  }, [query, activeCategory])

  const showBrowse = !query.trim()

  return (
    <div className="discover-view">
      <div className="discover-search-header">
        <div className="discover-search-wrap">
          <Search size={15} className="discover-search-icon" />
          <input
            className="discover-search"
            placeholder="Search plants — tomato, basil, blueberry…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="discover-search-clear" onClick={() => setQuery('')}>✕</button>
          )}
        </div>

      </div>

      <div className="discover-filters">
        <div className="discover-filters-label">Filter</div>
        <div className="discover-filters-chips">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`discover-cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
          {showBrowse && POPULAR.map(name => (
            <button key={name} className="discover-chip" onClick={() => setQuery(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="suggestion-list">
          {results.map(p => (
            <PlantCard key={p.id} plant={p} onAdd={onAddPlant} />
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="discover-empty">
          <p className="discover-empty-text">No plants found for "{query}".</p>
        </div>
      )}
    </div>
  )
}

function PlantCard({ plant, onAdd }) {
  const categoryColor = CATEGORY_COLORS[plant.category] ?? '#7fb069'
  return (
    <div className="suggestion-card" style={{ '--category-color': categoryColor }}>
      <div className="plant-card-row">
        <div className="plant-card-img plant-card-img--empty"><Emoji>{plant.emoji}</Emoji></div>
        <div className="plant-card-info">
          <div className="suggestion-name">{plant.common_name}</div>
          {plant.scientific_name && <div className="suggestion-variety">{plant.scientific_name}</div>}
          <div className="plant-card-tags">
            {plant.category   && <span className="suggestion-category-pill">{plant.category}</span>}
            {plant.cycle      && <span className="plant-tag">{plant.cycle}</span>}
            {plant.difficulty && <span className="plant-tag">{plant.difficulty}</span>}
          </div>
          {plant.description && (
            <p className="plant-card-description">{plant.description}</p>
          )}
          <div className="plant-card-meta">
            {plant.watering        && <span className="plant-meta-item"><Droplets size={11} />{plant.watering}</span>}
            {plant.sunlight        && <span className="plant-meta-item"><Sun size={11} />{plant.sunlight}</span>}
            {plant.days_to_harvest && <span className="plant-meta-item">{plant.days_to_harvest}d harvest</span>}
          </div>
        </div>
      </div>
      <button
        className="btn-add-suggestion"
        aria-label="Add to garden"
        onClick={() => onAdd({
          name:                    plant.common_name,
          variety:                 plant.scientific_name,
          category:                plant.category,
          plant_family:            plant.plant_family,
          days_to_harvest:         plant.days_to_harvest,
          water_interval_days:     plant.water_interval_days,
          fertilize_interval_days: plant.fertilize_interval_days,
          prune_interval_days:     plant.prune_interval_days,
          harvest_interval_days:   plant.harvest_interval_days,
        })}
      >
        <Plus size={15} strokeWidth={2.5} />
      </button>
    </div>
  )
}
