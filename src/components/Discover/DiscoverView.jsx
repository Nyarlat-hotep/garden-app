import { useState, useEffect } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'
import { getCurrentSeason, SEASON_LABELS } from '../../utils/seasons.js'
import { CATEGORY_COLORS } from '../../utils/format.js'
import './DiscoverView.css'

const CATEGORIES = ['vegetable', 'fruit', 'herb', 'protein']

export default function DiscoverView({ profile, onAddPlant }) {
  const [category, setCategory]     = useState('vegetable')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [aiText, setAiText]         = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [showAI, setShowAI]         = useState(false)

  const season = getCurrentSeason()
  const zone   = profile?.hardiness_zone ?? '7'
  const location = profile?.location ?? 'your area'

  const fetchSuggestions = async () => {
    setLoading(true)
    setResults([])
    setAiText('')
    setShowAI(false)
    try {
      const res = await fetch('/api/claude-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone, season, category, location }),
      })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch when category/zone changes
  useEffect(() => { fetchSuggestions() }, [category, zone])

  const fetchAI = async () => {
    if (aiText) { setShowAI(true); return }
    setShowAI(true)
    setAiLoading(true)
    try {
      const res = await fetch('/api/claude-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantName: `${category}s in general`, zone, season }),
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAiText(text)
      }
    } catch { setAiText('Unable to load advice.') }
    finally { setAiLoading(false) }
  }

  return (
    <div className="discover-view">
      <div className="discover-header">
        <div className="discover-location">
          <MapPin size={13} />
          <span>{location}</span>
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

      {loading ? (
        <div className="discover-loading">
          <div className="discover-loading-dots">
            <span /><span /><span />
          </div>
          <div className="discover-loading-text">Finding recommendations...</div>
        </div>
      ) : results.length > 0 ? (
        <div className="suggestion-list">
          {results.map((r, i) => (
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
      ) : (
        <div className="discover-empty">
          <button className="btn-refresh" onClick={fetchSuggestions}><RefreshCw size={14} /> Try again</button>
        </div>
      )}

      <button className="btn-ask-claude" onClick={fetchAI}>
        🌿 {showAI ? 'Seasonal advice' : 'Ask Claude for seasonal tips'}
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
