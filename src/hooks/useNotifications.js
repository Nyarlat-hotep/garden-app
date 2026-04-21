import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function useNotifications(userId, healthMap) {
  const [supported, setSupported]   = useState(false)
  const [permission, setPermission] = useState('default')
  const [subscribed, setSubscribed] = useState(false)
  const [hasOverdue, setHasOverdue] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
    setPermission(Notification.permission ?? 'default')
  }, [])

  // Compute in-app overdue indicator from healthMap
  useEffect(() => {
    if (!healthMap) return
    for (const { status } of healthMap.values()) {
      if (status !== 'healthy') { setHasOverdue(true); return }
    }
    setHasOverdue(false)
  }, [healthMap])

  async function requestPermission() {
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  async function subscribe() {
    if (!supported) return
    const perm = permission === 'granted' ? 'granted' : await requestPermission()
    if (perm !== 'granted') return

    const reg = await navigator.serviceWorker.ready
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const { endpoint, keys } = sub.toJSON()
    await supabase.from('profiles').update({
      push_endpoint: endpoint,
      push_p256dh: keys.p256dh,
      push_auth: keys.auth,
    }).eq('id', userId)

    setSubscribed(true)
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    await supabase.from('profiles').update({ push_endpoint: null, push_p256dh: null, push_auth: null }).eq('id', userId)
    setSubscribed(false)
  }

  return { supported, permission, subscribed, hasOverdue, requestPermission, subscribe, unsubscribe }
}
