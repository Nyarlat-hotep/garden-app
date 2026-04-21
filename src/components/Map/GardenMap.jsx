import { useState } from 'react'
import { Plus } from 'lucide-react'
import BedCell from './BedCell.jsx'
import RotationWarning from './RotationWarning.jsx'
import { SEASONS, SEASON_LABELS } from '../../utils/seasons.js'
import './GardenMap.css'

export default function GardenMap({
  beds, currentAssignments, rotationWarnings,
  plants, gridCols, selectedSeason, selectedYear,
  setSelectedSeason, setSelectedYear, onAddBed, onAssignPlant, onClearBed,
}) {
  const [dragPlant, setDragPlant] = useState(null) // { plant, sourceBedId }
  const [inputName, setInputName] = useState('')
  const [showAddBed, setShowAddBed] = useState(false)

  const assignmentMap = new Map(currentAssignments.map(a => [a.bed_id, a]))

  const handleAddBed = () => {
    const name = inputName.trim()
    if (!name) return
    onAddBed(name)
    setInputName('')
    setShowAddBed(false)
  }

  const warnings = [...rotationWarnings.values()]

  return (
    <div className="garden-map-view">
      {/* Season selector */}
      <div className="map-controls">
        <div className="season-selector">
          {SEASONS.map(s => (
            <button
              key={s}
              className={`season-opt ${selectedSeason === s ? 'active' : ''}`}
              onClick={() => setSelectedSeason(s)}
            >
              {SEASON_LABELS[s]}
            </button>
          ))}
        </div>
        <input
          className="year-input"
          type="number"
          value={selectedYear}
          onChange={e => setSelectedYear(parseInt(e.target.value))}
          min="2020" max="2099"
        />
      </div>

      {warnings.length > 0 && (
        <div className="rotation-warnings">
          {warnings.map((w, i) => <RotationWarning key={i} warning={w} />)}
        </div>
      )}

      {/* Draggable plants sidebar */}
      {plants.length > 0 && (
        <div className="map-plants-sidebar">
          <div className="map-sidebar-label">Drag plants onto beds</div>
          <div className="map-plants-chips">
            {plants.map(p => (
              <div
                key={p.id}
                className="plant-chip"
                draggable
                onDragStart={() => setDragPlant({ plant: p, sourceBedId: null })}
                onDragEnd={() => setDragPlant(null)}
              >
                {p.name}{p.variety ? ` · ${p.variety}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {beds.length > 0 ? (
        <div className="bed-grid" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {beds.map(bed => (
            <BedCell
              key={bed.id}
              bed={bed}
              assignment={assignmentMap.get(bed.id)}
              hasWarning={rotationWarnings.has(bed.id)}
              dragPlant={dragPlant}
              onDrop={(bedId) => dragPlant && onAssignPlant(bedId, dragPlant.plant)}
              onClear={onClearBed}
              onDragStart={(plant) => setDragPlant({ plant, sourceBedId: bed.id })}
              onDragEnd={() => setDragPlant(null)}
            />
          ))}
        </div>
      ) : (
        <div className="map-empty">
          <div className="map-empty-icon">🗺️</div>
          <div className="map-empty-text">No garden beds yet</div>
        </div>
      )}

      {/* Add bed */}
      <div className="map-add-bed">
        {showAddBed ? (
          <div className="add-bed-row">
            <input
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              placeholder="Bed name (e.g. Raised Bed A)"
              onKeyDown={e => e.key === 'Enter' && handleAddBed()}
              autoFocus
            />
            <button className="btn-save-sm" onClick={handleAddBed}>Add</button>
            <button className="btn-cancel-sm" onClick={() => setShowAddBed(false)}>✕</button>
          </div>
        ) : (
          <button className="btn-add-bed" onClick={() => setShowAddBed(true)}>
            <Plus size={14} /> Add bed
          </button>
        )}
      </div>
    </div>
  )
}
