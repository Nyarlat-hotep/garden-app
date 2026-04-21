import { useState, useEffect, useRef } from 'react'
import { Search, Droplets, Sun } from 'lucide-react'
import './DiscoverView.css'

const POPULAR = [
  'Tomato', 'Basil', 'Cucumber', 'Bell Pepper', 'Lettuce',
  'Strawberry', 'Mint', 'Carrot', 'Zucchini', 'Rosemary',
  'Spinach', 'Blueberry',
]

export default function DiscoverView({ onAddPlant }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); setSearched(false); return }
    timerRef.current = setTimeout(() => runSearch(query), 350)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const runSearch = async (q) => {
    setLoading(true)
    setSearched(true)
    try {
      const res  = await fetch('/api/perenual-search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="discover-view">
      <div className="discover-search-header">
        <div className="discover-search-wrap">
          <Search size={15} className="discover-search-icon" />
          <input
            className="discover-search"
            placeholder="Search any plant — tomato, basil, apple…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="discover-search-clear" onClick={() => setQuery('')}>✕</button>
          )}
        </div>
      </div>

      {!query && (
        <div className="discover-popular">
          <div className="discover-popular-label">Popular</div>
          <div className="discover-popular-chips">
            {POPULAR.map(name => (
              <button key={name} className="discover-chip" onClick={() => setQuery(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="discover-loading">
          <div className="discover-loading-dots"><span /><span /><span /></div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="suggestion-list">
          {results.map(r => (
            <PlantCard key={r.id} plant={r} onAdd={onAddPlant} />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="discover-empty">
          <p className="discover-empty-text">No plants found for "{query}".</p>
        </div>
      )}
    </div>
  )
}

function PlantCard({ plant, onAdd }) {
  const sunlight = Array.isArray(plant.sunlight) ? plant.sunlight[0] : plant.sunlight
  return (
    <div className="suggestion-card">
      <div className="plant-card-row">
        {plant.image_url
          ? <img className="plant-card-img" src={plant.image_url} alt={plant.name || plant.common_name} loading="lazy" />
          : <div className="plant-card-img plant-card-img--empty">🌱</div>
        }
        <div className="plant-card-info">
          <div className="suggestion-name">{plant.common_name || plant.name}</div>
          {plant.scientific_name && <div className="suggestion-variety">{plant.scientific_name}</div>}
          <div className="plant-card-tags">
            {plant.cycle && <span className="plant-tag">{plant.cycle}</span>}
          </div>
          <div className="plant-card-meta">
            {plant.watering && <span className="plant-meta-item"><Droplets size={11} />{plant.watering}</span>}
            {sunlight      && <span className="plant-meta-item"><Sun size={11} />{sunlight}</span>}
          </div>
        </div>
      </div>
      <button className="btn-add-suggestion" onClick={() => onAdd({ name: plant.common_name || plant.name, variety: plant.scientific_name, category: 'vegetable' })}>
        + Add to garden
      </button>
    </div>
  )
}
