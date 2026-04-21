const CACHE = 'garden-v1'
const SHELL = ['/garden-app/', '/garden-app/index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(self.registration.showNotification(data.title ?? 'Garden Reminder', {
    body: data.body ?? 'You have plants that need attention.',
    icon: '/garden-app/icons/icon-192.png',
    badge: '/garden-app/icons/icon-192.png',
    tag: data.tag ?? 'garden-reminder',
    data: { view: data.view ?? 'garden' },
  }))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/garden-app/?view=' + e.notification.data.view))
})
