import { motion } from 'framer-motion'
import { X, Edit2, Trash2, ClipboardList, Droplets, FlaskConical, Scissors, Wheat, Sprout, Bug, Beaker, Hand, Square, Leaf, AlertTriangle, SprayCan, ExternalLink } from 'lucide-react'
import HealthBadge from './HealthBadge.jsx'
import OverdueIcons from './OverdueIcons.jsx'
import { formatDate, formatRelative, CATEGORY_LABELS } from '../../utils/format.js'
import CareTimer from '../Shared/CareTimer.jsx'
import { getRecommendationsForPlant, amazonSearch } from '../../data/productRecommendations.js'
import './PlantDetailModal.css'

const SHOP_ICONS = {
  flask:    FlaskConical,
  bug:      Bug,
  droplets: Droplets,
  hand:     Hand,
  scissors: Scissors,
  square:   Square,
  beaker:   Beaker,
  alert:    AlertTriangle,
  leaf:     Leaf,
  spray:    SprayCan,
}

const CATEGORY_ORDER = ['Care', 'Tools', 'Problem-solving']

export default function PlantDetailModal({ plant, health, plantLogs, onClose, onEdit, onDelete, onLogActivity, onPlantIt }) {
  if (!plant) return null

  const recs = getRecommendationsForPlant(plant)
  const recsByCategory = recs.reduce((acc, r) => {
    (acc[r.category] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal-box detail-modal-box"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
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

        <div className="detail-care-intervals">
          {plant.water_interval_days && (
            <span><Droplets size={13} /><b>Water</b> {plant.is_planted
              ? <CareTimer plant={plant} latestLogs={plantLogs} field="water_interval_days" type="watered" />
              : <span className="detail-care-static">every {plant.water_interval_days}d</span>}</span>
          )}
          {plant.fertilize_interval_days && (
            <span><FlaskConical size={13} /><b>Fertilize</b> {plant.is_planted
              ? <CareTimer plant={plant} latestLogs={plantLogs} field="fertilize_interval_days" type="fertilized" />
              : <span className="detail-care-static">every {plant.fertilize_interval_days}d</span>}</span>
          )}
          {plant.prune_interval_days && (
            <span><Scissors size={13} /><b>Prune</b> {plant.is_planted
              ? <CareTimer plant={plant} latestLogs={plantLogs} field="prune_interval_days" type="pruned" />
              : <span className="detail-care-static">every {plant.prune_interval_days}d</span>}</span>
          )}
          {plant.days_to_harvest && <span><Wheat size={13} /><b>Harvest</b> in {plant.days_to_harvest}d</span>}
        </div>

        {recs.length > 0 && (
          <section className="detail-shop">
            <div className="detail-shop-header">
              <h3 className="detail-shop-title">Recommended for your {plant.name}</h3>
              <p className="detail-shop-disclaimer">Affiliate links — we may earn a commission</p>
            </div>
            {CATEGORY_ORDER.map(cat => {
              const list = recsByCategory[cat]
              if (!list?.length) return null
              return (
                <div key={cat} className="detail-shop-group">
                  <div className="detail-shop-group-label">{cat}</div>
                  <div className="detail-shop-grid">
                    {list.map(rec => {
                      const Icon = SHOP_ICONS[rec.icon] ?? Sprout
                      return (
                        <a key={rec.id}
                           className="shop-card"
                           href={amazonSearch(rec.query)}
                           target="_blank"
                           rel="noopener noreferrer sponsored">
                          <Icon size={20} className="shop-card-icon" />
                          <div className="shop-card-body">
                            <div className="shop-card-title">{rec.title}</div>
                            <div className="shop-card-blurb">{rec.blurb}</div>
                          </div>
                          <span className="shop-card-cta">Shop <ExternalLink size={12} /></span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        <div className="detail-actions">
          {!plant.is_planted ? (
            <>
              <button className="detail-action-btn detail-action-btn--primary" onClick={() => onPlantIt(plant)}>
                <Sprout size={15} /> Plant it
              </button>
              <button className="detail-action-btn" onClick={() => onEdit(plant)}>
                <Edit2 size={15} /> Edit
              </button>
              <button className="detail-action-btn detail-action-btn--danger" onClick={() => onDelete(plant)}>
                <Trash2 size={15} /> Delete
              </button>
            </>
          ) : (
            <>
              <button className="detail-action-btn" onClick={() => onLogActivity(plant)}>
                <ClipboardList size={15} /> Log activity
              </button>
              <button className="detail-action-btn" onClick={() => onEdit(plant)}>
                <Edit2 size={15} /> Edit
              </button>
              <button className="detail-action-btn detail-action-btn--danger" onClick={() => onDelete(plant)}>
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
