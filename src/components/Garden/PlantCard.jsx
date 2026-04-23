import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'
import HealthBadge from './HealthBadge.jsx'
import OverdueIcons from './OverdueIcons.jsx'
import Emoji from '../Shared/Emoji.jsx'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import { CATEGORY_COLORS } from '../../utils/format.js'
import { formatRelative } from '../../utils/format.js'
import './PlantCard.css'

function emojiForPlant(name) {
  const match = FOOD_PLANTS.find(fp => fp.common_name.toLowerCase() === name.toLowerCase())
  return match?.emoji ?? '🌱'
}

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
          : <div className="plant-card-no-image"><Emoji>{emojiForPlant(plant.name)}</Emoji></div>
        }
      </div>

      <div className="plant-card-body">
        <span className="plant-card-category-pill">{plant.category}</span>
        <div className="plant-card-name">{plant.name}</div>
        {plant.variety && <div className="plant-card-variety">{plant.variety}</div>}

        <div className="plant-card-footer">
          <HealthBadge status={health?.status ?? 'healthy'} />
          <OverdueIcons overdueTypes={health?.overdueTypes ?? []} />
        </div>

        <div className="plant-card-meta">
          <span className="plant-card-watered">
            <Droplets size={12} /> {formatRelative(lastWatered)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
