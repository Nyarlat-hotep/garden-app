import { useState, useEffect, useRef } from 'react'
import { MapPin, RefreshCw, Search, Pencil } from 'lucide-react'
import { getCurrentSeason, SEASON_LABELS } from '../../utils/seasons.js'
import { CATEGORY_COLORS } from '../../utils/format.js'
import './DiscoverView.css'

const CATEGORIES = ['vegetable', 'fruit', 'herb', 'protein']

function useLocationTypeahead() {
  const [query, setQuery]           = useState('')
  const [places, setPlaces]         = useState([])
  const [searching, setSearching]   = useState(false)
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

  useEffect(() => {
    setQuery(initialValue ?? '')
  }, [initialValue])

  useEffect(() => {
    setOpen(places.length > 0)
  }, [places])

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (place) => {
    setOpen(false)
    setPlaces([])
    onSelect(place)
  }

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
        {onCancel && (
          <button className="btn-location-cancel" onClick={onCancel}>Cancel</button>
        )}
      </div>
      {open && places.length > 0 && (
        <ul className="location-dropdown">
          {places.map((p, i) => (
            <li key={i} className="location-dropdown-item" onMouseDown={() => handleSelect(p)}>
              <MapPin size={11} />
              {p.label}
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
  const [aiText, setAiText]       = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI]       = useState(false)
  const [search, setSearch]       = useState('')
  const [editingLocation, setEditingLocation] = useState(false)
  const [savingLocation, setSavingLocation]   = useState(false)

  const season   = getCurrentSeason()
  const zone     = profile?.hardiness_zone ?? ''
  const location = profile?.location ?? ''

  const fetchSuggestions = async (loc) => {
    const useLocation = loc ?? location
    if (!useLocation) return
    setLoading(true)
    setResults([])
    setAiText('')
    setShowAI(false)
    setSearch('')
    try {
      const res  = await fetch('/api/claude-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone, season, category, location: useLocation }),
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
    if (location) fetchSuggestions()
  }, [category, location])

  const handleSelectLocation = async (place) => {
    if (!saveProfile) return
    setSavingLocation(true)
    try {
      await saveProfile({ location: place.label, latitude: place.lat, longitude: place.lon })
      setEditingLocation(false)
    } catch {}
    setSavingLocation(false)
  }

  const fetchAI = async () => {
    if (aiText) { setShowAI(true); return }
    setShowAI(true)
    setAiLoading(true)
    try {
      const res  = await fetch('/api/claude-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantName: `${category}s in general`, zone, season, location }),
      })
      setAiText(await res.text())
    } catch {
      setAiText('Unable to load advice.')
    } finally {
      setAiLoading(false)
    }
  }

  const filtered = results.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.variety_suggestion ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reason ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // No location yet — show full-page setup
  if (!location && !editingLocation) {
    return (
      <div className="discover-view">
        <div className="location-setup-card">
          <div className="location-setup-icon">🌍</div>
          <div className="location-setup-title">Where is your garden?</div>
          <p className="location-setup-desc">Enter your city or region to get personalized plant recommendations for your climate and current season.</p>
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
            <button className="btn-edit-location" onClick={() => setEditingLocation(true)}>
              <Pencil size={11} />
            </button>
            <span className="discover-season">{SEASON_LABELS[season]}</span>
          </div>
        )}
        {zone && !editingLocation && <span className="discover-zone">Zone {zone}</span>}
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
          <div className="discover-loading-text">Finding recommendations...</div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="suggestion-list">
          {filtered.map((r, i) => (
            <div key={i} className="suggestion-card">
              <div className="suggestion-card-top">
                <div>
                  <div className="suggestion-name">{r.name}</div>
                  {r.variety_suggestion && <div className="suggestion-variety">{r.variety_suggestion}</div>}
                </div>
                <div className="suggestion-meta">
                  <span className={`suggestion-difficulty difficulty--${r.difficulty}`}>{r.difficulty}</span>
                  {r.days_to_harvest && <span className="suggestion-days">{r.days_to_harvest}d</span>}
                </div>
              </div>
              <p className="suggestion-reason">{r.reason}</p>
              {r.tip && <p className="suggestion-tip">💡 {r.tip}</p>}
              <button className="btn-add-suggestion" onClick={() => onAddPlant({ name: r.name, variety: r.variety_suggestion, category })}>
                + Add to garden
              </button>
            </div>
          ))}
        </div>
      ) : !loading && location ? (
        <div className="discover-empty">
          <p className="discover-empty-text">{search ? 'No matches for that search.' : 'No suggestions loaded.'}</p>
          <button className="btn-refresh" onClick={() => fetchSuggestions()}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : null}

      <button className="btn-ask-claude" onClick={fetchAI}>
        🌿 {showAI ? 'Seasonal advice' : `Ask Claude for ${category} tips this ${season}`}
      </button>

      {showAI && (
        <div className="ai-advice-panel">
          {aiLoading && !aiText
            ? <div className="ai-loading">Loading advice...</div>
            : <p className="ai-text">{aiText}</p>
          }
        </div>
      )}
    </div>
  )
}
