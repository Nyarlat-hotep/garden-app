import { useState, useEffect } from 'react'
import { MapPin, RefreshCw, Search, Pencil } from 'lucide-react'
import { getCurrentSeason, SEASON_LABELS } from '../../utils/seasons.js'
import { CATEGORY_COLORS } from '../../utils/format.js'
import './DiscoverView.css'

const CATEGORIES = ['vegetable', 'fruit', 'herb', 'protein']

export default function DiscoverView({ profile, saveProfile, onAddPlant }) {
  const [category, setCategory]     = useState('vegetable')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [aiText, setAiText]         = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [showAI, setShowAI]         = useState(false)
  const [search, setSearch]         = useState('')
  const [editingLocation, setEditingLocation] = useState(false)
  const [locationInput, setLocationInput]     = useState('')
  const [savingLocation, setSavingLocation]   = useState(false)

  const season   = getCurrentSeason()
  const zone     = profile?.hardiness_zone ?? ''
  const location = profile?.location ?? ''

  const fetchSuggestions = async (loc, z) => {
    const useLocation = loc ?? location
    const useZone     = z ?? zone
    if (!useLocation) return
    setLoading(true)
    setResults([])
    setAiText('')
    setShowAI(false)
    setSearch('')
    try {
      const res = await fetch('/api/claude-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: useZone, season, category, location: useLocation }),
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

  const handleSaveLocation = async () => {
    if (!locationInput.trim() || !saveProfile) return
    setSavingLocation(true)
    try {
      await saveProfile({ location: locationInput.trim() })
      setEditingLocation(false)
    } catch {}
    setSavingLocation(false)
  }

  const fetchAI = async () => {
    if (aiText) { setShowAI(true); return }
    setShowAI(true)
    setAiLoading(true)
    try {
      const res = await fetch('/api/claude-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantName: `${category}s in general`, zone, season, location }),
      })
      const text = await res.text()
      setAiText(text)
    } catch { setAiText('Unable to load advice.') }
    finally { setAiLoading(false) }
  }

  const filtered = results.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.variety_suggestion || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(search.toLowerCase())
  )

  // Location not set — show setup prompt
  if (!location && !editingLocation) {
    return (
      <div className="discover-view">
        <div className="location-setup-card">
          <div className="location-setup-icon">🌍</div>
          <div className="location-setup-title">Where is your garden?</div>
          <p className="location-setup-desc">Enter your city or region to get personalized plant recommendations for your climate and the current season.</p>
          <div className="location-setup-row">
            <input
              className="location-input"
              placeholder="e.g. Portland, Oregon"
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveLocation()}
              autoFocus
            />
            <button className="btn-save-location" onClick={handleSaveLocation} disabled={savingLocation || !locationInput.trim()}>
              {savingLocation ? '...' : 'Find plants'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="discover-view">
      <div className="discover-header">
        <div className="discover-location">
          <MapPin size={13} />
          {editingLocation ? (
            <div className="location-edit-row">
              <input
                className="location-input-inline"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveLocation(); if (e.key === 'Escape') setEditingLocation(false) }}
                autoFocus
              />
              <button className="btn-save-location-sm" onClick={handleSaveLocation} disabled={savingLocation}>
                {savingLocation ? '...' : 'Save'}
              </button>
            </div>
          ) : (
            <>
              <span>{location}</span>
              <button className="btn-edit-location" onClick={() => { setLocationInput(location); setEditingLocation(true) }}>
                <Pencil size={11} />
              </button>
            </>
          )}
          <span className="discover-season">{SEASON_LABELS[season]}</span>
        </div>
        {zone && <span className="discover-zone">Zone {zone}</span>}
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
          <button className="btn-refresh" onClick={() => fetchSuggestions()}><RefreshCw size={14} /> Try again</button>
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
