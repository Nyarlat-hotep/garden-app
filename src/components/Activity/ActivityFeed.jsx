import ActivityItem from './ActivityItem.jsx'
import './ActivityFeed.css'

function groupByDate(logs) {
  const groups = {}
  for (const log of logs) {
    const date = new Date(log.logged_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
  }
  return Object.entries(groups)
}

export default function ActivityFeed({ logs, plantsMap }) {
  if (logs.length === 0) {
    return (
      <div className="activity-empty">
        <div className="activity-empty-icon">📋</div>
        <div className="activity-empty-text">No activity logged yet</div>
        <div className="activity-empty-sub">Tap + to log your first activity</div>
      </div>
    )
  }

  const groups = groupByDate(logs)

  return (
    <div className="activity-feed">
      {groups.map(([date, items]) => (
        <div key={date} className="activity-group">
          <div className="activity-date-label">{date}</div>
          {items.map(log => (
            <ActivityItem key={log.id} log={log} plantName={plantsMap?.get(log.plant_id)?.name ?? 'Unknown'} />
          ))}
        </div>
      ))}
    </div>
  )
}
