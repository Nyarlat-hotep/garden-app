import PlantCard from './PlantCard.jsx'
import './PlantGrid.css'

export default function PlantGrid({ plants, healthMap, latestLogsMap, onSelect }) {
  const logsMap = latestLogsMap ? latestLogsMap() : new Map()

  if (plants.length === 0) {
    return (
      <div className="plant-grid-empty">
        <div className="plant-grid-empty-icon">🌱</div>
        <div className="plant-grid-empty-text">No plants yet</div>
        <div className="plant-grid-empty-sub">Tap + to add your first plant</div>
      </div>
    )
  }

  return (
    <div className="plant-grid">
      {plants.map((plant, i) => {
        const health = healthMap?.get(plant.id)
        const plantLogs = logsMap.get(plant.id) ?? {}
        return (
          <PlantCard
            key={plant.id}
            plant={plant}
            health={health}
            lastWatered={plantLogs.watered}
            onClick={onSelect}
            index={i}
          />
        )
      })}
    </div>
  )
}
