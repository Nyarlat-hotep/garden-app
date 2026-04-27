import { memo } from 'react'
import { AlertCircle, Droplets, Scissors, FlaskConical, Wheat } from 'lucide-react'
import Emoji from '../Shared/Emoji.jsx'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import './GardenSidebar.css'

function emojiForPlant(plant) {
  const match = FOOD_PLANTS.find(fp => fp.common_name.toLowerCase() === plant.name.toLowerCase())
  return match?.emoji ?? '🌱'
}

const OVERDUE_ICONS = {
  watered:    { Icon: Droplets,     color: '#5b9bd5' },
  pruned:     { Icon: Scissors,     color: '#7fb069' },
  fertilized: { Icon: FlaskConical, color: '#8b5e3c' },
  harvested:  { Icon: Wheat,        color: '#d4a843' },
}

const GardenSidebar = memo(function GardenSidebar({ plants, healthMap, onSelectPlant }) {
  if (!plants || plants.length === 0) {
    return (
      <div className="garden-sidebar">
        <div className="sidebar-header"><h3>Plants</h3></div>
        <div className="sidebar-empty">
          <p>No plants yet</p>
          <p className="sidebar-empty-sub">Add plants from Discover to get started</p>
        </div>
      </div>
    )
  }

  const planted = plants.filter(p => p.is_planted)
  const critical  = planted.filter(p => healthMap?.get(p.id)?.status === 'critical').length
  const attention = planted.filter(p => healthMap?.get(p.id)?.status === 'attention').length
  const overdue   = planted.filter(p => (healthMap?.get(p.id)?.overdueTypes ?? []).length > 0).length

  return (
    <div className="garden-sidebar">
      <div className="sidebar-header">
        <h3>Plants</h3>
        <span className="sidebar-count">{plants.length}</span>
      </div>

      {(critical > 0 || attention > 0 || overdue > 0) && (
        <div className="sidebar-stats">
          {critical  > 0 && <span className="sidebar-stat sidebar-stat--critical">{critical} critical</span>}
          {attention > 0 && <span className="sidebar-stat sidebar-stat--attention">{attention} attention</span>}
          {overdue   > 0 && <span className="sidebar-stat sidebar-stat--overdue">{overdue} overdue</span>}
        </div>
      )}

      <div className="sidebar-plant-list">
        {plants.map(plant => {
          const health = healthMap?.get(plant.id)
          const status = health?.status ?? 'healthy'
          const overdueTypes = health?.overdueTypes ?? []
          return (
            <button
              key={plant.id}
              className={`sidebar-plant-item${!plant.is_planted ? ' sidebar-plant-item--unplanted' : ''}`}
              onClick={() => onSelectPlant(plant)}
            >
              <div className="sidebar-plant-icon"><Emoji>{emojiForPlant(plant)}</Emoji></div>
              <div className="sidebar-plant-info">
                <div className="sidebar-plant-name">{plant.name}</div>
                {plant.variety && <div className="sidebar-plant-variety">{plant.variety}</div>}
                {!plant.is_planted && (
                  <div className="sidebar-plant-badge">
                    <AlertCircle size={10} />
                    <span>Not planted yet</span>
                  </div>
                )}
                {plant.is_planted && overdueTypes.length > 0 && (
                  <div className="sidebar-plant-overdue">
                    {overdueTypes.map(t => {
                      const cfg = OVERDUE_ICONS[t]
                      if (!cfg) return null
                      const { Icon, color } = cfg
                      return <Icon key={t} size={11} strokeWidth={2} style={{ color }} />
                    })}
                    <span>overdue</span>
                  </div>
                )}
              </div>
              {plant.is_planted && (
                <span className={`sidebar-plant-dot sidebar-plant-dot--${status}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default GardenSidebar
