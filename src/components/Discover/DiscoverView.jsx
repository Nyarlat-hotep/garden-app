import { useState, useMemo, useEffect } from 'react'
import { Search, Droplets, Sun, Plus, Check, MapPin } from 'lucide-react'
import { ALL_PLANTS } from '../../data/allPlants'
import { CATEGORY_COLORS } from '../../utils/format'
import { SEASONS, SEASON_LABELS, getCurrentSeason } from '../../utils/seasons'
import { zoneInRange } from '../../utils/location'
import LocationSetter from './LocationSetter'
import Emoji from '../Shared/Emoji.jsx'
import './DiscoverView.css'

const CATEGORIES = ['all', 'vegetable', 'fruit', 'herb', 'protein', 'flower']
const LOCATION_KEY = 'garden-app:user-location'

function readSavedLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.zip || !parsed?.hardiness_zone) return null
    return parsed
  } catch {
    return null
  }
}

export default function DiscoverView({ ownedPlants = [], profile, saveProfile, onAddPlant }) {
  const [query, setQuery]                   = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSeason, setActiveSeason]     = useState(() => getCurrentSeason())
  const [activeBloomSeason, setActiveBloomSeason] = useState(null)
  const [location, setLocation]             = useState(() => readSavedLocation())
  const [locationOpen, setLocationOpen]     = useState(false)

  useEffect(() => {
    if (profile?.zip && profile?.hardiness_zone &&
        (!location || location.zip !== profile.zip)) {
      const next = {
        zip: profile.zip,
        hardiness_zone: profile.hardiness_zone,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
      }
      setLocation(next)
      try { localStorage.setItem(LOCATION_KEY, JSON.stringify(next)) } catch {}
    }
  }, [profile?.zip, profile?.hardiness_zone, profile?.latitude, profile?.longitude]) // eslint-disable-line

  const ownedNames = useMemo(
    () => new Set(ownedPlants.map(p => p.name?.toLowerCase().trim())),
    [ownedPlants]
  )

  const userZone = location?.hardiness_zone

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_PLANTS
      .filter(p => {
        if (q) {
          const matchesText =
            p.common_name.toLowerCase().includes(q) ||
            (p.scientific_name && p.scientific_name.toLowerCase().includes(q))
          if (!matchesText) return false
        }
        if (activeCategory !== 'all' && p.category !== activeCategory) return false
        if (userZone && !zoneInRange(userZone, p.zones)) return false
        if (activeSeason && p.planting_seasons && !p.planting_seasons.includes(activeSeason)) return false
        if (activeCategory === 'flower' && activeBloomSeason &&
            (!p.bloom_seasons || !p.bloom_seasons.includes(activeBloomSeason))) return false
        return true
      })
      .sort((a, b) => a.common_name.localeCompare(b.common_name))
  }, [query, activeCategory, activeSeason, activeBloomSeason, userZone])

  function handleSaveLocation(loc) {
    setLocation(loc)
    try { localStorage.setItem(LOCATION_KEY, JSON.stringify(loc)) } catch {}
    setLocationOpen(false)
    if (saveProfile) {
      saveProfile({
        zip: loc.zip,
        hardiness_zone: loc.hardiness_zone,
        latitude: loc.latitude ?? null,
        longitude: loc.longitude ?? null,
      }).catch(err => console.warn('Failed to persist location to profile:', err))
    }
  }

  function handleClearLocation() {
    setLocation(null)
    try { localStorage.removeItem(LOCATION_KEY) } catch {}
    setLocationOpen(false)
    if (saveProfile) {
      saveProfile({
        zip: null,
        hardiness_zone: null,
        latitude: null,
        longitude: null,
      }).catch(err => console.warn('Failed to clear location on profile:', err))
    }
  }

  return (
    <div className="discover-view">
      <div className="discover-search-header">
        <div className="discover-search-row">
          <div className="discover-search-wrap">
            <Search size={15} className="discover-search-icon" />
            <input
              className="discover-search"
              placeholder="Search plants — tomato, basil, blueberry…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="discover-search-clear" onClick={() => setQuery('')}>✕</button>
            )}
          </div>

          <button
            type="button"
            className={`discover-location-pill${location ? ' discover-location-pill--set' : ''}`}
            onClick={() => setLocationOpen(true)}
            aria-label={location ? 'Change your location' : 'Set your location'}
          >
            <MapPin size={13} />
            <span>{location ? `${location.zip} · Zone ${location.hardiness_zone}` : 'Set location'}</span>
          </button>
        </div>
      </div>

      <div className="discover-filters">
        <div className="discover-filters-label">Category</div>
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
        </div>
      </div>

      <div className="discover-filters">
        <div className="discover-filters-label">Plant in season</div>
        <div className="discover-filters-chips">
          {SEASONS.map(s => (
            <button
              key={s}
              className={`discover-cat-tab ${activeSeason === s ? 'active' : ''}`}
              onClick={() => setActiveSeason(activeSeason === s ? null : s)}
            >
              {SEASON_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {activeCategory === 'flower' && (
        <div className="discover-filters">
          <div className="discover-filters-label">Bloom season</div>
          <div className="discover-filters-chips">
            {SEASONS.map(s => (
              <button
                key={s}
                className={`discover-cat-tab ${activeBloomSeason === s ? 'active' : ''}`}
                onClick={() => setActiveBloomSeason(activeBloomSeason === s ? null : s)}
              >
                {SEASON_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="suggestion-list">
          {results.map(p => (
            <PlantCard
              key={p.id}
              plant={p}
              owned={ownedNames.has(p.common_name.toLowerCase().trim())}
              onAdd={onAddPlant}
            />
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="discover-empty">
          <p className="discover-empty-text">
            {query ? `No plants found for "${query}".` : 'No plants match those filters.'}
          </p>
        </div>
      )}

      {locationOpen && (
        <LocationSetter
          initialZip={location?.zip || ''}
          onSave={handleSaveLocation}
          onClear={handleClearLocation}
          onCancel={() => setLocationOpen(false)}
        />
      )}
    </div>
  )
}

function PlantCard({ plant, owned, onAdd }) {
  const categoryColor = CATEGORY_COLORS[plant.category] ?? '#7fb069'
  const isFlower = plant.category === 'flower'
  const bloomLabel = isFlower && plant.bloom_seasons?.length
    ? plant.bloom_seasons.map(s => SEASON_LABELS[s] || s).join(', ')
    : null
  return (
    <div className={`suggestion-card${owned ? ' suggestion-card--owned' : ''}`} style={{ '--category-color': categoryColor }}>
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
            {bloomLabel
              ? <span className="plant-meta-item">Blooms {bloomLabel}</span>
              : plant.days_to_harvest && <span className="plant-meta-item">{plant.days_to_harvest}d harvest</span>}
          </div>
        </div>
      </div>
      <button
        className="btn-add-suggestion"
        aria-label={owned ? 'Already in garden' : 'Add to garden'}
        disabled={owned}
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
        {owned ? <Check size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
      </button>
    </div>
  )
}
