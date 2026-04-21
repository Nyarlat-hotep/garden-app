import { motion } from 'framer-motion'
import HealthBadge from './HealthBadge.jsx'
import OverdueIcons from './OverdueIcons.jsx'
import { CATEGORY_COLORS } from '../../utils/format.js'
import { formatRelative } from '../../utils/format.js'
import './PlantCard.css'

export default function PlantCard({ plant, health, lastWatered, onClick, index }) {
  const categoryColor = CATEGORY_COLORS[plant.category] ?? '#7fb069'

  return (
    <motion.button
      className="plant-card"
      onClick={() => onClick(plant)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.3) }}
      style={{ '--category-color': categoryColor }}
    >
      <div className="plant-card-image">
        {plant.image_url
          ? <img src={plant.image_url} alt={plant.name} />
          : <div className="plant-card-no-image">🌱</div>
        }
        <div className="plant-card-category-dot" />
      </div>

      <div className="plant-card-body">
        <div className="plant-card-name">{plant.name}</div>
        {plant.variety && <div className="plant-card-variety">{plant.variety}</div>}

        <div className="plant-card-footer">
          <HealthBadge status={health?.status ?? 'healthy'} />
          <OverdueIcons overdueTypes={health?.overdueTypes ?? []} />
        </div>

        <div className="plant-card-meta">
          <span className="plant-card-watered">
            💧 {formatRelative(lastWatered)}
          </span>
          {plant.date_planted && (
            <span className="plant-card-planted">
              Planted {formatRelative(plant.date_planted)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
