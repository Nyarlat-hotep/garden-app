import { motion } from 'framer-motion'
import './ConfirmDelete.css'

export default function ConfirmDelete({ item, onConfirm, onCancel }) {
  if (!item) return null
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <motion.div className="modal-box confirm-box"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}>
        <div className="confirm-title">Delete {item.name}?</div>
        <div className="confirm-sub">
          {item.is_planted
            ? 'This will remove the plant from your garden map and delete all activity logs. This cannot be undone.'
            : 'This will remove the plant from your inventory. This cannot be undone.'}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-delete" onClick={() => onConfirm(item)}>Delete</button>
        </div>
      </motion.div>
    </div>
  )
}
