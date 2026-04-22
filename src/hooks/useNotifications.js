import { useState, useEffect, useMemo } from 'react'

const CARE_LABELS = { watered: 'Water', fertilized: 'Fertilize' }

export function useNotifications(userId, healthMap, plants = []) {
  const [permission, setPermission] = useState(() => Notification?.permission ?? 'default')
  const [hasOverdue, setHasOverdue] = useState(false)

  useEffect(() => {
    if (!healthMap) return
    for (const { status } of healthMap.values()) {
      if (status !== 'healthy') { setHasOverdue(true); return }
    }
    setHasOverdue(false)
  }, [healthMap])

  // Plants overdue for water or fertilize only
  const overdueItems = useMemo(() => {
    if (!healthMap || !plants.length) return []
    return plants
      .map(p => ({
        plant: p,
        overdueTypes: (healthMap.get(p.id)?.overdueTypes ?? []).filter(t => t === 'watered' || t === 'fertilized'),
      }))
      .filter(({ overdueTypes }) => overdueTypes.length > 0)
  }, [healthMap, plants])

  // Fire a browser notification once when app loads and permission already granted
  useEffect(() => {
    if (permission !== 'granted' || !overdueItems.length) return
    const n = new Notification('Garden needs attention 🌱', {
      body: overdueItems.length === 1
        ? `${overdueItems[0].plant.name} needs care`
        : `${overdueItems.length} plants need care`,
      icon: '/favicon.ico',
      tag: 'garden-overdue',
      silent: true,
    })
    return () => n.close()
  }, [permission]) // intentionally only on permission change, not every render

  async function enableNotifications() {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted' && overdueItems.length) {
      new Notification('Garden needs attention 🌱', {
        body: overdueItems.length === 1
          ? `${overdueItems[0].plant.name} needs care`
          : `${overdueItems.length} plants need care`,
        icon: '/favicon.ico',
        tag: 'garden-overdue',
        silent: true,
      })
    }
    return result
  }

  return { permission, hasOverdue, overdueItems, enableNotifications, CARE_LABELS }
}
