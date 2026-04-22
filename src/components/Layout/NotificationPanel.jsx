import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, FlaskConical, BellOff, BellRing, X } from 'lucide-react'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import './NotificationPanel.css'

function emojiFor(name) {
  return FOOD_PLANTS.find(f => f.common_name.toLowerCase() === name?.toLowerCase())?.emoji ?? '🌱'
}

const ICON  = { watered: Droplets, fertilized: FlaskConical }
const LABEL = { watered: 'Needs water', fertilized: 'Needs fertilizer' }

async function fireBrowserNotification() {
  if (Notification.permission !== 'granted') return
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification('🍅 Tomato needs water', {
      body: 'Last watered 4 days ago — overdue by 1 day',
      icon: '/icons/icon-192.png',
      tag: 'garden-test-' + Date.now(),
    })
  } else {
    new Notification('🍅 Tomato needs water', { body: 'Last watered 4 days ago — overdue by 1 day' })
  }
}

export default function NotificationPanel({ overdueItems, permission, onEnable, onClose }) {
  const notSupported = !('Notification' in window)
  const [countdown, setCountdown] = useState(null)
  const timerRef = useRef(null)
  const intervalRef = useRef(null)

  function startDelayedTest() {
    setCountdown(10)
    intervalRef.current = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) {
          clearInterval(intervalRef.current)
          fireBrowserNotification()
          return null
        }
        return n - 1
      })
    }, 1000)
  }

  function cancelTest() {
    clearInterval(intervalRef.current)
    setCountdown(null)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

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

          {/* Test button */}
          {permission === 'granted' && (
            countdown === null
              ? <button className="notif-test-btn" onClick={startDelayedTest}>
                  Send test notification (10s delay — switch away first)
                </button>
              : <button className="notif-test-btn notif-test-btn--counting" onClick={cancelTest}>
                  Firing in {countdown}s — click to cancel
                </button>
          )}

          {overdueItems.length === 0 ? (
            <div className="notif-empty">All plants are on track</div>
          ) : (
            <div className="notif-list">
              {overdueItems.map(({ plant, overdueTypes }) => (
                <div key={plant.id} className="notif-item">
                  <span className="notif-emoji">{emojiFor(plant.name)}</span>
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
