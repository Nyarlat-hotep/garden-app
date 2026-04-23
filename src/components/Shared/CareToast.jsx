import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, FlaskConical, X } from 'lucide-react'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import Emoji from './Emoji.jsx'
import './CareToast.css'

function emojiFor(name) {
  return FOOD_PLANTS.find(f => f.common_name.toLowerCase() === name?.toLowerCase())?.emoji ?? '🌱'
}

export default function CareToast({ overdueItems, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  if (!overdueItems.length) return null

  const waterCount    = overdueItems.filter(i => i.overdueTypes.includes('watered')).length
  const fertilizeCount = overdueItems.filter(i => i.overdueTypes.includes('fertilized')).length

  return (
    <AnimatePresence>
      <motion.div
        className="care-toast"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.22 }}
      >
        <div className="care-toast-body">
          <div className="care-toast-plants">
            {overdueItems.slice(0, 3).map(({ plant }) => (
              <span key={plant.id} className="care-toast-emoji"><Emoji>{emojiFor(plant.name)}</Emoji></span>
            ))}
            {overdueItems.length > 3 && <span className="care-toast-more">+{overdueItems.length - 3}</span>}
          </div>
          <div className="care-toast-text">
            <span className="care-toast-headline">
              {overdueItems.length === 1 ? overdueItems[0].plant.name : `${overdueItems.length} plants`} need attention
            </span>
            <div className="care-toast-tags">
              {waterCount > 0 && (
                <span className="care-toast-tag care-toast-tag--water">
                  <Droplets size={10} />{waterCount > 1 ? `${waterCount} need water` : 'needs water'}
                </span>
              )}
              {fertilizeCount > 0 && (
                <span className="care-toast-tag care-toast-tag--fertilize">
                  <FlaskConical size={10} />{fertilizeCount > 1 ? `${fertilizeCount} need fertilizer` : 'needs fertilizer'}
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="care-toast-close" onClick={onDismiss}><X size={13} /></button>
      </motion.div>
    </AnimatePresence>
  )
}
