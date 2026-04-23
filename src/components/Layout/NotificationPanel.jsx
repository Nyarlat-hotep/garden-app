import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, FlaskConical, BellOff, BellRing, X } from 'lucide-react'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import Emoji from '../Shared/Emoji.jsx'
import './NotificationPanel.css'

function emojiFor(name) {
  return FOOD_PLANTS.find(f => f.common_name.toLowerCase() === name?.toLowerCase())?.emoji ?? '🌱'
}

const ICON  = { watered: Droplets, fertilized: FlaskConical }
const LABEL = { watered: 'Needs water', fertilized: 'Needs fertilizer' }

export default function NotificationPanel({ overdueItems, permission, onEnable, onClose }) {
  const notSupported = !('Notification' in window)

  return (
    <AnimatePresence>
      <motion.div
        className="notif-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="notif-panel"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            <button className="notif-close" onClick={onClose}><X size={15} /></button>
          </div>

          {!notSupported && permission !== 'granted' && permission !== 'denied' && (
            <button className="notif-enable-btn" onClick={onEnable}>
              <BellRing size={15} />
              <span>Enable browser notifications</span>
            </button>
          )}
          {permission === 'denied' && (
            <div className="notif-denied">
              <BellOff size={14} />
              Notifications blocked — allow them in browser settings
            </div>
          )}

          {overdueItems.length === 0 ? (
            <div className="notif-empty">All plants are on track</div>
          ) : (
            <div className="notif-list">
              {overdueItems.map(({ plant, overdueTypes }) => (
                <div key={plant.id} className="notif-item">
                  <span className="notif-emoji"><Emoji>{emojiFor(plant.name)}</Emoji></span>
                  <div className="notif-item-body">
                    <span className="notif-plant-name">{plant.name}</span>
                    <div className="notif-tags">
                      {overdueTypes.map(t => {
                        const Icon = ICON[t]
                        return (
                          <span key={t} className={`notif-tag notif-tag--${t}`}>
                            <Icon size={11} />{LABEL[t]}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
