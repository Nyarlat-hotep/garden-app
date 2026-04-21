import './HealthBadge.css'

const STATUS_CONFIG = {
  healthy:   { label: 'Healthy',   cls: 'healthy' },
  attention: { label: 'Attention', cls: 'attention' },
  critical:  { label: 'Critical',  cls: 'critical' },
}

export default function HealthBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.healthy
  return <span className={`health-badge health-badge--${cfg.cls}`}>{cfg.label}</span>
}
