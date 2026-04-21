import { useState, useEffect, useRef } from 'react'
import { MapPin, RefreshCw, Search, Pencil, Droplets, Sun } from 'lucide-react'
import { CATEGORY_COLORS } from '../../utils/format.js'
import './DiscoverView.css'

const CATEGORIES = ['vegetable', 'fruit', 'herb', 'protein']
const ZONES = Array.from({ length: 13 }, (_, i) => String(i + 1))

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
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch]       = useState('')
  const [editingLocation, setEditingLocation] = useState(false)
  const [editingZone, setEditingZone]         = useState(false)
  const [savingLocation, setSavingLocation]   = useState(false)
  const [pendingZone, setPendingZone]         = useState('')

  const location = profile?.location ?? ''
  const zone     = profile?.hardiness_zone ?? ''

  const fetchPlants = async (cat, z, pg, append = false) => {
    if (!z) return
    if (append) setLoadingMore(true)
    else { setLoading(true); setResults([]) }
    try {
      const res  = await fetch('/api/perenual-browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, zone: z, page: pg }),
      })
      const data = await res.json()
      if (append) setResults(prev => [...prev, ...(Array.isArray(data) ? data : [])])
      else setResults(Array.isArray(data) ? data : [])
    } catch {
      if (!append) setResults([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    setSearch('')
    if (zone) fetchPlants(category, zone, 1)
  }, [category, zone])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPlants(category, zone, next, true)
  }

  const handleSelectLocation = async (place) => {
    const estimatedZone = estimateZone(place.lat)
    setPendingZone(estimatedZone)
  }

  const handleSaveLocation = async (place, zoneVal) => {
    if (!saveProfile) return
    setSavingLocation(true)
    try {
      await saveProfile({ location: place.label, latitude: place.lat, longitude: place.lon, hardiness_zone: zoneVal })
      setEditingLocation(false)
      setPendingZone('')
    } catch {}
    setSavingLocation(false)
  }

  const filtered = results.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.scientific_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // First-time setup — no location yet
  if (!location) {
    return (
      <div className="discover-view">
        <LocationSetupFlow
          onSave={handleSaveLocation}
          saving={savingLocation}
          pendingZone={pendingZone}
          setPendingZone={setPendingZone}
          onSelectPlace={handleSelectLocation}
        />
      </div>
    )
  }

  return (
    <div className="discover-view">
      <div className="discover-header">
        {editingLocation ? (
          <LocationTypeahead
            initialValue={location}
            onSelect={(p) => handleSelectLocation(p)}
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

      {!zone && !editingZone && (
        <div className="zone-missing-banner">
          No hardiness zone set — <button className="btn-inline-link" onClick={() => { setPendingZone(''); setEditingZone(true) }}>add your zone</button> to filter plants correctly.
        </div>
      )}

      {editingZone && (
        <div className="zone-picker-inline">
          <select className="zone-select" value={pendingZone} onChange={e => setPendingZone(e.target.value)} autoFocus>
            <option value="">Select zone...</option>
            {ZONES.map(z => <option key={z} value={z}>Zone {z}</option>)}
          </select>
          <button
            className="btn-save-location"
            disabled={!pendingZone || savingLocation}
            onClick={async () => {
              setSavingLocation(true)
              try { await saveProfile({ hardiness_zone: pendingZone }) } catch {}
              setEditingZone(false)
              setSavingLocation(false)
            }}
          >
            {savingLocation ? '...' : 'Save'}
          </button>
          <button className="btn-location-cancel" onClick={() => setEditingZone(false)}>Cancel</button>
        </div>
      )}

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
      ) : !zone ? null : filtered.length > 0 ? (
        <>
          <div className="suggestion-list">
            {filtered.map((r) => (
              <PlantCard key={r.id} plant={r} category={category} onAdd={onAddPlant} />
            ))}
          </div>
          {!search && (
            <button className="btn-load-more" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </>
      ) : (
        <div className="discover-empty">
          <p className="discover-empty-text">{search ? 'No matches.' : 'No plants found for this zone and category.'}</p>
          <button className="btn-refresh" onClick={() => fetchPlants(category, zone, 1)}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}
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
            {plant.watering && (
              <span className="plant-meta-item"><Droplets size={11} />{plant.watering}</span>
            )}
            {sunlight && (
              <span className="plant-meta-item"><Sun size={11} />{sunlight}</span>
            )}
          </div>
        </div>
      </div>
      <button
        className="btn-add-suggestion"
        onClick={() => onAdd({ name: plant.name, variety: plant.scientific_name, category })}
      >
        + Add to garden
      </button>
    </div>
  )
}

function LocationSetupFlow({ onSave, saving, pendingZone, setPendingZone, onSelectPlace }) {
  const [selectedPlace, setSelectedPlace] = useState(null)

  const handleSelect = (place) => {
    setSelectedPlace(place)
    onSelectPlace(place)
  }

  return (
    <div className="location-setup-card">
      <div className="location-setup-icon">🌍</div>
      <div className="location-setup-title">Where is your garden?</div>
      <p className="location-setup-desc">Enter your city to get plants matched to your climate and hardiness zone.</p>
      <LocationTypeahead onSelect={handleSelect} />
      {selectedPlace && (
        <div className="zone-picker-row">
          <label className="zone-picker-label">Hardiness zone</label>
          <select
            className="zone-select"
            value={pendingZone}
            onChange={e => setPendingZone(e.target.value)}
          >
            <option value="">Select zone</option>
            {ZONES.map(z => <option key={z} value={z}>Zone {z}</option>)}
          </select>
          <button
            className="btn-save-location"
            onClick={() => onSave(selectedPlace, pendingZone)}
            disabled={saving || !pendingZone}
          >
            {saving ? '...' : 'Find plants'}
          </button>
        </div>
      )}
      {saving && <p className="location-saving-text">Saving...</p>}
    </div>
  )
}
