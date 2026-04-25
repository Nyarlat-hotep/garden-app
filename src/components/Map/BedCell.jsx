import { useState } from 'react'
import { X } from 'lucide-react'
import './BedCell.css'

export default function BedCell({ bed, assignment, hasWarning, dragPlant, onDrop, onClear, onDragStart, onDragEnd }) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); onDrop(bed.id) }

  return (
    <div
      className={`bed-cell ${assignment ? 'occupied' : 'empty'} ${isDragOver ? 'drag-over' : ''} ${hasWarning ? 'warning' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bed-cell-name">{bed.name}</div>
      {assignment ? (
        <div className="bed-cell-plant">
          <span
            className="bed-cell-plant-chip"
            draggable
            onDragStart={() => onDragStart({ id: assignment.plant_id, name: assignment.plant_name, plant_family: assignment.plant_family })}
            onDragEnd={onDragEnd}
          >
            {assignment.plant_name}
          </span>
          <button className="bed-cell-clear" onClick={() => onClear(bed.id)}><X size={11} /></button>
        </div>
      ) : (
        <div className="bed-cell-empty-hint">{dragPlant ? 'Drop here' : '+'}</div>
      )}
      {hasWarning && <div className="bed-cell-warning-dot" title="Rotation conflict" />}
    </div>
  )
}
