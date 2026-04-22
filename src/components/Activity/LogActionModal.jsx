import { useState } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Scissors, Sprout, Wheat, Shield, FileText } from 'lucide-react'
import './LogActionModal.css'

const ACTIVITIES = [
  { type: 'watered',    label: 'Watered',    Icon: Droplets,  color: '#5b9bd5' },
  { type: 'pruned',     label: 'Pruned',     Icon: Scissors,  color: '#7fb069' },
  { type: 'fertilized', label: 'Fertilized', Icon: Sprout,    color: '#8b5e3c' },
  { type: 'harvested',  label: 'Harvested',  Icon: Wheat,     color: '#d4a843' },
  { type: 'treated',    label: 'Treated',    Icon: Shield,    color: '#9c59b6' },
  { type: 'noted',      label: 'Note',       Icon: FileText,  color: '#95a5a6' },
]

export default function LogActionModal({ plants, preselectedPlantId, onSave, onClose }) {
  const [plantId, setPlantId]     = useState(preselectedPlantId ?? plants[0]?.id ?? '')
  const [activities, setActivities] = useState(new Set(['watered']))
  const [notes, setNotes]         = useState('')
  const [quantity, setQuantity]   = useState('')
  const [loggedAt, setLoggedAt]   = useState(new Date().toISOString().slice(0, 16))

  const toggleActivity = (type) => {
    setActivities(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const handleSave = () => {
    if (!plantId || activities.size === 0) return
    const base = {
      plant_id: plantId,
      notes: notes.trim() || null,
      quantity: quantity.trim() || null,
      logged_at: new Date(loggedAt).toISOString(),
    }
    onSave([...activities].map(activity => ({ ...base, activity })))
  }

  const showQuantity = activities.has('harvested') || activities.has('fertilized')

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="modal-heading">Log Activity</div>

        <div className="modal-fields">
          <div className="modal-field">
            <label className="modal-label">Plant</label>
            <select value={plantId} onChange={e => setPlantId(e.target.value)}>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}{p.variety ? ` (${p.variety})` : ''}</option>)}
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">Activity</label>
            <div className="activity-grid">
              {ACTIVITIES.map(({ type, label, Icon, color }) => (
                <button
                  key={type}
                  className={`activity-opt ${activities.has(type) ? 'active' : ''}`}
                  style={{ '--act-color': color }}
                  onClick={() => toggleActivity(type)}
                >
                  <Icon size={22} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {showQuantity && (
            <div className="modal-field">
              <label className="modal-label">Quantity</label>
              <input value={quantity} onChange={e => setQuantity(e.target.value)} placeholder={activities.has('harvested') ? 'e.g. 500g' : 'e.g. 10ml'} />
            </div>
          )}

          <div className="modal-field">
            <label className="modal-label">Date & time</label>
            <input type="datetime-local" value={loggedAt} onChange={e => setLoggedAt(e.target.value)} />
          </div>

          <div className="modal-field">
            <label className="modal-label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional..." />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save</button>
        </div>
      </motion.div>
    </div>
  )
}
