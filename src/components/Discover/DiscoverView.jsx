import { useState, useEffect, useRef } from 'react'
import { MapPin, RefreshCw, Search, Pencil, Droplets, Sun } from 'lucide-react'
import { CATEGORY_COLORS } from '../../utils/format.js'
import './DiscoverView.css'

const CATEGORIES = ['vegetable', 'fruit', 'herb', 'protein']

function estimateZone(lat) {
  if (lat == null) return ''
  if (lat >= 50) return '3'
  if (lat >= 47) return '4'
  if (lat >= 43) return '5'
  if (lat >= 38) return '6'
  if (lat >= 34) return '7'
  if (lat >= 30) return '8'
  if (lat >= 26) return '9'
  if (lat >= 22) return '10'
  return '11'
}

function useLocationTypeahead() {
  const [query, setQuery]         = useState('')
  const [places, setPlaces]       = useState([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 3) { setPlaces([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`)
        const data = await res.json()
        const seen = new Set()
        const results = (data.features ?? [])
          .filter(f => ['city','town','village','municipality','county'].includes(f.properties.type))
          .reduce((acc, f) => {
            const { name, state, country, countrycode } = f.properties
            const parts = [name, state, countrycode === 'US' ? 'USA' : country].filter(Boolean)
            const label = parts.join(', ')
            if (!seen.has(label)) {
              seen.add(label)
              acc.push({ label, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] })
            }
            return acc
          }, [])
        setPlaces(results)
      } catch {
        setPlaces([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  return { query, setQuery, places, setPlaces, searching }
}

function LocationTypeahead({ initialValue, onSelect, onCancel }) {
  const { query, setQuery, places, setPlaces, searching } = useLocationTypeahead()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(initialValue ?? '') }, [initialValue])
  useEffect(() => { setOpen(places.length > 0) }, [places])

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="location-typeahead-wrap" ref={wrapRef}>
      <div className="location-typeahead-input-row">
        <MapPin size={14} className="location-typeahead-pin" />
        <input
          className="location-input"
          placeholder="City, state or region..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => places.length > 0 && setOpen(true)}
          autoFocus
        />
        {searching && <span className="location-searching-dot" />}
        {onCancel && <button className="btn-location-cancel" onClick={onCancel}>Cancel</button>}
      </div>
      {open && places.length > 0 && (
        <ul className="location-dropdown">
          {places.map((p, i) => (
            <li key={i} className="location-dropdown-item" onMouseDown={() => { setOpen(false); setPlaces([]); onSelect(p) }}>
              <MapPin size={11} />{p.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DiscoverView({ profile, saveProfile, onAddPlant }) {
  const [category, setCategory]   = useState('vegetable')
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [editingLocation, setEditingLocation] = useState(false)
  const [savingLocation, setSavingLocation]   = useState(false)

  const location = profile?.location ?? ''
  const zone     = profile?.hardiness_zone ?? ''

  // Auto-fix missing zone from stored lat if profile already has location but no zone
  useEffect(() => {
    if (location && !zone && profile?.latitude != null && saveProfile) {
      const estimated = estimateZone(profile.latitude)
      if (estimated) saveProfile({ hardiness_zone: estimated })
    }
  }, [location, zone, profile?.latitude])

  const fetchPlants = async (cat, z) => {
    if (!z) return
    setLoading(true)
    setResults([])
    try {
      const res  = await fetch('/api/perenual-browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, zone: z }),
      })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSearch('')
    if (zone) fetchPlants(category, zone)
  }, [category, zone])

  const handleSelectLocation = async (place) => {
    if (!saveProfile) return
    setSavingLocation(true)
    try {
      await saveProfile({
        location:        place.label,
        latitude:        place.lat,
        longitude:       place.lon,
        hardiness_zone:  estimateZone(place.lat),
      })
      setEditingLocation(false)
    } catch {}
    setSavingLocation(false)
  }

  const filtered = results.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.scientific_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (!location) {
    return (
      <div className="discover-view">
        <div className="location-setup-card">
          <div className="location-setup-icon">🌍</div>
          <div className="location-setup-title">Where is your garden?</div>
          <p className="location-setup-desc">Enter your city to get plants matched to your climate.</p>
          <LocationTypeahead onSelect={handleSelectLocation} />
          {savingLocation && <p className="location-saving-text">Saving...</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="discover-view">
      <div className="discover-header">
        {editingLocation ? (
          <LocationTypeahead
            initialValue={location}
            onSelect={handleSelectLocation}
            onCancel={() => setEditingLocation(false)}
          />
        ) : (
          <div className="discover-location">
            <MapPin size={13} />
            <span>{location}</span>
            <button className="btn-edit-location" onClick={() => setEditingLocation(true)}><Pencil size={11} /></button>
            {zone && <span className="discover-zone">Zone {zone}</span>}
          </div>
        )}
      </div>

      <div className="category-tabs">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`category-tab ${category === c ? 'active' : ''}`}
            style={{ '--cat-color': CATEGORY_COLORS[c] }}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {results.length > 0 && (
        <div className="discover-search-wrap">
          <Search size={13} className="discover-search-icon" />
          <input
            className="discover-search"
            placeholder="Search plants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="discover-loading">
          <div className="discover-loading-dots"><span /><span /><span /></div>
          <div className="discover-loading-text">Loading plants...</div>
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="suggestion-list">
            {filtered.map((r) => (
              <PlantCard key={r.id} plant={r} category={category} onAdd={onAddPlant} />
            ))}
          </div>
        </>
      ) : !loading && zone ? (
        <div className="discover-empty">
          <p className="discover-empty-text">{search ? 'No matches.' : 'No plants found.'}</p>
          <button className="btn-refresh" onClick={() => fetchPlants(category, zone, 1)}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : null}
    </div>
  )
}

function PlantCard({ plant, category, onAdd }) {
  const sunlight = plant.sunlight?.[0] ?? ''
  return (
    <div className="suggestion-card">
      <div className="plant-card-row">
        {plant.image_url
          ? <img className="plant-card-img" src={plant.image_url} alt={plant.name} loading="lazy" />
          : <div className="plant-card-img plant-card-img--empty">🌱</div>
        }
        <div className="plant-card-info">
          <div className="suggestion-name">{plant.name}</div>
          {plant.scientific_name && <div className="suggestion-variety">{plant.scientific_name}</div>}
          <div className="plant-card-tags">
            {plant.cycle && <span className="plant-tag">{plant.cycle}</span>}
            {plant.hardiness_min && plant.hardiness_max &&
              <span className="plant-tag">Zone {plant.hardiness_min}–{plant.hardiness_max}</span>}
          </div>
          <div className="plant-card-meta">
            {plant.watering && <span className="plant-meta-item"><Droplets size={11} />{plant.watering}</span>}
            {sunlight      && <span className="plant-meta-item"><Sun size={11} />{sunlight}</span>}
          </div>
        </div>
      </div>
      <button className="btn-add-suggestion" onClick={() => onAdd({ name: plant.name, variety: plant.scientific_name, category })}>
        + Add to garden
      </button>
    </div>
  )
}
