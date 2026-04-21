import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Edit2, Trash2, ClipboardList } from 'lucide-react'
import HealthBadge from './HealthBadge.jsx'
import OverdueIcons from './OverdueIcons.jsx'
import { formatDate, formatRelative, CATEGORY_LABELS } from '../../utils/format.js'
import './PlantDetailModal.css'

export default function PlantDetailModal({ plant, health, plantLogs, onClose, onEdit, onDelete, onLogActivity }) {
  const [showAI, setShowAI] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const fetchAdvice = async () => {
    if (aiText) { setShowAI(true); return }
    setShowAI(true)
    setAiLoading(true)
    try {
      const res = await fetch('/api/claude-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantName: plant.name,
          variety: plant.variety,
          perenualData: plant.perenual_data,
          recentActivity: plantLogs,
        }),
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAiText(text)
      }
    } catch {
      setAiText('Unable to load AI advice right now.')
    } finally {
      setAiLoading(false)
    }
  }

  if (!plant) return null

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal-box detail-modal-box"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <button className="detail-close" onClick={onClose}><X size={18} /></button>

        <div className="detail-header">
          {plant.image_url && (
            <div className="detail-image">
              <img src={plant.image_url} alt={plant.name} />
            </div>
          )}
          <div className="detail-title-block">
            <div className="detail-name">{plant.name}</div>
            {plant.variety && <div className="detail-variety">{plant.variety}</div>}
            <div className="detail-category">{CATEGORY_LABELS[plant.category] ?? plant.category}</div>
          </div>
        </div>

        <div className="detail-health-row">
          <HealthBadge status={health?.status ?? 'healthy'} />
          <OverdueIcons overdueTypes={health?.overdueTypes ?? []} />
        </div>

        <div className="detail-stats">
          {plant.date_planted && (
            <div className="detail-stat">
              <span className="detail-stat-label">Planted</span>
              <span className="detail-stat-val">{formatDate(plant.date_planted)}</span>
            </div>
          )}
          {plant.days_to_harvest && (
            <div className="detail-stat">
              <span className="detail-stat-label">Days to harvest</span>
              <span className="detail-stat-val">{plant.days_to_harvest}</span>
            </div>
          )}
          {plantLogs?.watered && (
            <div className="detail-stat">
              <span className="detail-stat-label">Last watered</span>
              <span className="detail-stat-val">{formatRelative(plantLogs.watered)}</span>
            </div>
          )}
          {plantLogs?.fertilized && (
            <div className="detail-stat">
              <span className="detail-stat-label">Last fertilized</span>
              <span className="detail-stat-val">{formatRelative(plantLogs.fertilized)}</span>
            </div>
          )}
        </div>

        {plant.notes && <p className="detail-notes">{plant.notes}</p>}

        {plant.perenual_data?.description && (
          <p className="detail-description">{plant.perenual_data.description}</p>
        )}

        <div className="detail-care-intervals">
          {plant.water_interval_days && <span>💧 Every {plant.water_interval_days}d</span>}
          {plant.fertilize_interval_days && <span>🌿 Every {plant.fertilize_interval_days}d</span>}
          {plant.prune_interval_days && <span>✂️ Every {plant.prune_interval_days}d</span>}
        </div>

        {/* AI advice */}
        <button className="btn-ai-advice" onClick={fetchAdvice}>
          {showAI ? '🌿 Care advice' : '🌿 Get AI care advice'}
        </button>

        {showAI && (
          <div className="detail-ai-panel">
            {aiLoading && !aiText
              ? <div className="ai-loading">Loading advice...</div>
              : <p className="ai-text">{aiText}</p>
            }
          </div>
        )}

        <div className="detail-actions">
          <button className="detail-action-btn" onClick={() => onLogActivity(plant)}>
            <ClipboardList size={15} /> Log activity
          </button>
          <button className="detail-action-btn" onClick={() => onEdit(plant)}>
            <Edit2 size={15} /> Edit
          </button>
          <button className="detail-action-btn detail-action-btn--danger" onClick={() => onDelete(plant)}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}
