import { Droplets, Scissors, Sprout, Wheat } from 'lucide-react'
import './OverdueIcons.css'

const ICONS = {
  watered:    { Icon: Droplets, color: '#5b9bd5', title: 'Needs water' },
  pruned:     { Icon: Scissors, color: '#7fb069', title: 'Needs pruning' },
  fertilized: { Icon: Sprout,   color: '#8b5e3c', title: 'Needs fertilizing' },
  harvested:  { Icon: Wheat,    color: '#d4a843', title: 'Ready to harvest' },
}

export default function OverdueIcons({ overdueTypes = [] }) {
  if (overdueTypes.length === 0) return null
  return (
    <div className="overdue-icons">
      {overdueTypes.map(type => {
        const cfg = ICONS[type]
        if (!cfg) return null
        const { Icon, color, title } = cfg
        return (
          <span key={type} className="overdue-icon" title={title} style={{ color }}>
            <Icon size={13} strokeWidth={2} />
          </span>
        )
      })}
    </div>
  )
}
