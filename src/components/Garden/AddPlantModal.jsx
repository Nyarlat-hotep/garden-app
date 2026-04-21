import { useState } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import './AddPlantModal.css'

const CATEGORIES = ['vegetable', 'fruit', 'herb', 'protein']

const DEFAULT_FORM = {
  name: '', variety: '', category: 'vegetable', plant_family: '',
  date_planted: new Date().toISOString().slice(0, 10),
  notes: '', image_url: '',
  water_interval_days: 2, prune_interval_days: '', fertilize_interval_days: '', harvest_interval_days: '',
  days_to_harvest: '',
}

export default function AddPlantModal({ onSave, onClose }) {
  const [form, setForm]         = useState(DEFAULT_FORM)
  const [searchQ, setSearchQ]   = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSearch = async () => {
    if (!searchQ.trim()) return
    setSearching(true)
    setResults([])
    try {
      const res = await fetch('/api/perenual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQ }),
      })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      // fail silently — user can fill manually
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (r) => {
    setForm(f => ({
      ...f,
      name: r.common_name || f.name,
      image_url: r.image_url || f.image_url,
      perenual_id: r.id,
      perenual_data: r,
    }))
    setResults([])
    setSearchQ('')
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({
      id: uuidv4(),
      ...form,
      water_interval_days: form.water_interval_days ? parseInt(form.water_interval_days) : 2,
      prune_interval_days: form.prune_interval_days ? parseInt(form.prune_interval_days) : null,
      fertilize_interval_days: form.fertilize_interval_days ? parseInt(form.fertilize_interval_days) : null,
      harvest_interval_days: form.harvest_interval_days ? parseInt(form.harvest_interval_days) : null,
      days_to_harvest: form.days_to_harvest ? parseInt(form.days_to_harvest) : null,
    })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="modal-heading">Add Plant</div>

        {/* Perenual search */}
        <div className="modal-search-row">
          <input
            placeholder="Search plant database..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-search" onClick={handleSearch} disabled={searching}>
            {searching ? '...' : 'Search'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="modal-results">
            {results.map(r => (
              <button key={r.id} className="modal-result-item" onClick={() => handleSelectResult(r)}>
                {r.image_url && <img src={r.image_url} alt={r.common_name} />}
                <span>{r.common_name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="modal-fields">
          <div className="modal-field">
            <label className="modal-label">Plant name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cherry Tomato" />
          </div>

          <div className="modal-field">
            <label className="modal-label">Variety</label>
            <input value={form.variety} onChange={e => set('variety', e.target.value)} placeholder="e.g. Sun Gold" />
          </div>

          <div className="modal-field">
            <label className="modal-label">Category</label>
            <div className="category-toggle">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`category-opt ${form.category === c ? 'active' : ''}`}
                  onClick={() => set('category', c)}
                  style={{ '--cat-color': `var(--cat-${c})` }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Date planted</label>
              <input type="date" value={form.date_planted} onChange={e => set('date_planted', e.target.value)} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Days to harvest</label>
              <input type="number" value={form.days_to_harvest} onChange={e => set('days_to_harvest', e.target.value)} placeholder="60" min="1" />
            </div>
          </div>

          <div className="modal-label modal-section-label">Care intervals (days)</div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Water every</label>
              <input type="number" value={form.water_interval_days} onChange={e => set('water_interval_days', e.target.value)} min="1" />
            </div>
            <div className="modal-field">
              <label className="modal-label">Fertilize every</label>
              <input type="number" value={form.fertilize_interval_days} onChange={e => set('fertilize_interval_days', e.target.value)} placeholder="14" min="1" />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Prune every</label>
              <input type="number" value={form.prune_interval_days} onChange={e => set('prune_interval_days', e.target.value)} placeholder="30" min="1" />
            </div>
            <div className="modal-field">
              <label className="modal-label">Harvest every</label>
              <input type="number" value={form.harvest_interval_days} onChange={e => set('harvest_interval_days', e.target.value)} placeholder="7" min="1" />
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any notes..." />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={!form.name.trim()}>Save</button>
        </div>
      </motion.div>
    </div>
  )
}
