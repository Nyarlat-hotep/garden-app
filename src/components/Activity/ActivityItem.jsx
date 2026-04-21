import { Droplets, Scissors, Sprout, Wheat, Shield, FileText } from 'lucide-react'
import { formatRelative } from '../../utils/format.js'

const ACTIVITY_ICONS = {
  watered:    { Icon: Droplets,  color: '#5b9bd5' },
  pruned:     { Icon: Scissors,  color: '#7fb069' },
  fertilized: { Icon: Sprout,    color: '#8b5e3c' },
  harvested:  { Icon: Wheat,     color: '#d4a843' },
  treated:    { Icon: Shield,    color: '#9c59b6' },
  noted:      { Icon: FileText,  color: '#95a5a6' },
}

export default function ActivityItem({ log, plantName }) {
  const cfg = ACTIVITY_ICONS[log.activity] ?? ACTIVITY_ICONS.noted
  const { Icon, color } = cfg

  return (
    <div className="activity-item">
      <div className="activity-item-icon" style={{ color, borderColor: `${color}44`, background: `${color}11` }}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="activity-item-body">
        <span className="activity-item-plant">{plantName}</span>
        <span className="activity-item-action" style={{ color }}>{log.activity}</span>
        {log.quantity && <span className="activity-item-qty">{log.quantity}</span>}
        {log.notes && <span className="activity-item-notes">{log.notes}</span>}
      </div>
      <div className="activity-item-time">{formatRelative(log.logged_at)}</div>
    </div>
  )
}
