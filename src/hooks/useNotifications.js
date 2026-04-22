import { useState, useEffect, useMemo } from 'react'

async function showNotification(title, body, tag = 'garden-reminder') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  // Use SW showNotification — new Notification() is deprecated in Chrome
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      tag,
    })
  } else {
    new Notification(title, { body, tag })
  }
}

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

  const overdueItems = useMemo(() => {
    if (!healthMap || !plants.length) return []
    const items = plants
      .map(p => ({
        plant: p,
        overdueTypes: (healthMap.get(p.id)?.overdueTypes ?? []).filter(t => t === 'watered' || t === 'fertilized'),
      }))
      .filter(({ overdueTypes }) => overdueTypes.length > 0)
    return items
  }, [healthMap, plants])

  // Fire once on load when permission already granted and plants are overdue
  useEffect(() => {
    if (permission !== 'granted' || !overdueItems.length) return
    const body = overdueItems.length === 1
      ? `${overdueItems[0].plant.name} needs care`
      : `${overdueItems.length} plants need care`
    showNotification('Garden needs attention 🌱', body, 'garden-overdue')
  }, [permission]) // intentionally only on permission change

  async function enableNotifications() {
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted' && overdueItems.length) {
      const body = overdueItems.length === 1
        ? `${overdueItems[0].plant.name} needs care`
        : `${overdueItems.length} plants need care`
      await showNotification('Garden needs attention 🌱', body, 'garden-overdue')
    }
    return result
  }

  return { permission, hasOverdue, overdueItems, enableNotifications, showNotification }
}
