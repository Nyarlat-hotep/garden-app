import './RotationWarning.css'
import { SEASON_LABELS } from '../../utils/seasons.js'

export default function RotationWarning({ warning }) {
  return (
    <div className="rotation-warning">
      ⚠️ <strong>{warning.plantFamily}</strong> was already in this bed in {SEASON_LABELS[warning.lastSeenSeason]} {warning.lastSeenYear}. Consider rotating to a different bed.
    </div>
  )
}
