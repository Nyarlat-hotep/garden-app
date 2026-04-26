import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Loader2 } from 'lucide-react'
import {
  isValidUsZip,
  getZoneForZip,
  requestGeolocation,
  reverseGeocodeToZip,
} from '../../utils/location'
import './LocationSetter.css'

export default function LocationSetter({ initialZip = '', onSave, onClear, onCancel }) {
  const [zipInput, setZipInput] = useState(initialZip || '')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  const trimmed = zipInput.trim()
  const previewZone = isValidUsZip(trimmed) ? getZoneForZip(trimmed) : null
  const canSave = isValidUsZip(trimmed) && !!previewZone

  async function handleUseLocation() {
    setError('')
    setBusy(true)
    try {
      const { latitude, longitude } = await requestGeolocation()
      const zip = await reverseGeocodeToZip(latitude, longitude)
      if (!isValidUsZip(zip)) throw new Error('Got a non-US ZIP — please enter manually')
      setZipInput(zip)
    } catch (err) {
      setError(err?.message || 'Could not detect location')
    } finally {
      setBusy(false)
    }
  }

  function handleSave() {
    if (!canSave) return
    onSave({ zip: trimmed, hardiness_zone: previewZone })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <motion.div
        className="modal-box location-setter-box"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="location-setter-title">
          <MapPin size={16} /> Your location
        </div>
        <p className="location-setter-sub">
          We use your ZIP to find your USDA hardiness zone and recommend plants suited to your climate.
        </p>

        <div className="location-setter-field">
          <label className="modal-label" htmlFor="zip-input">US ZIP code</label>
          <input
            id="zip-input"
            className="location-setter-input"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 02134"
            value={zipInput}
            onChange={e => {
              setError('')
              setZipInput(e.target.value.replace(/[^\d]/g, '').slice(0, 5))
            }}
          />
          {previewZone && (
            <div className="location-setter-zone">
              USDA Zone <strong>{previewZone}</strong>
            </div>
          )}
          {trimmed.length === 5 && !previewZone && (
            <div className="location-setter-error">No zone found for that ZIP.</div>
          )}
        </div>

        <button
          className="location-setter-detect"
          onClick={handleUseLocation}
          disabled={busy}
        >
          {busy ? <Loader2 size={14} className="location-spin" /> : <MapPin size={14} />}
          {busy ? 'Detecting…' : 'Use my location'}
        </button>

        {error && <div className="location-setter-error">{error}</div>}

        <div className="modal-actions location-setter-actions">
          {initialZip && (
            <button className="btn-cancel location-setter-clear" onClick={onClear}>
              Clear
            </button>
          )}
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={!canSave}>
            Save
          </button>
        </div>
      </motion.div>
    </div>
  )
}
