import { memo } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import Emoji from '../Shared/Emoji.jsx'
import './GardenSidebar.css'

const GardenSidebar = memo(function GardenSidebar({ plants, onSelectPlant }) {
  if (!plants || plants.length === 0) {
    return (
      <div className="garden-sidebar">
        <div className="sidebar-header">
          <h3>Plants</h3>
        </div>
        <div className="sidebar-empty">
          <p>No plants yet</p>
          <p className="sidebar-empty-sub">Add plants from Discover to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="garden-sidebar">
      <div className="sidebar-header">
        <h3>Plants</h3>
        <span className="sidebar-count">{plants.length}</span>
      </div>

      <div className="sidebar-plant-list">
        {plants.map(plant => (
          <button
            key={plant.id}
            className={`sidebar-plant-item ${!plant.is_planted ? 'sidebar-plant-item--unplanted' : ''}`}
            onClick={() => onSelectPlant(plant)}
          >
            <div className="sidebar-plant-icon">
              <Emoji>{plant.emoji || '🌱'}</Emoji>
            </div>
            <div className="sidebar-plant-info">
              <div className="sidebar-plant-name">{plant.name}</div>
              {plant.variety && <div className="sidebar-plant-variety">{plant.variety}</div>}
              {!plant.is_planted && (
                <div className="sidebar-plant-badge">
                  <AlertCircle size={10} />
                  <span>Not planted yet</span>
                </div>
              )}
            </div>
            {plant.is_planted && (
              <div className="sidebar-plant-status">
                <Check size={14} className="planted-check" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
})

export default GardenSidebar
