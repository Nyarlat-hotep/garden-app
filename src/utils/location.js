import { getZoneForZipPrefix } from '../data/zipToZone'

export function isValidUsZip(zip) {
  return typeof zip === 'string' && /^\d{5}$/.test(zip)
}

export function getZoneForZip(zip) {
  if (!isValidUsZip(zip)) return null
  return getZoneForZipPrefix(zip.slice(0, 3))
}

export function parseZoneRange(zonesString) {
  if (!zonesString) return null
  const m = String(zonesString).match(/^(\d+)([ab])?\s*-\s*(\d+)([ab])?$/)
  if (!m) return null
  return { min: parseInt(m[1], 10), max: parseInt(m[3], 10) }
}

export function parseZoneNumber(zone) {
  if (zone == null) return null
  const m = String(zone).match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

export function zoneInRange(userZone, plantZonesRange) {
  const userN = parseZoneNumber(userZone)
  const range = parseZoneRange(plantZonesRange)
  if (userN == null || !range) return true
  return userN >= range.min && userN <= range.max
}

export function requestGeolocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10_000, maximumAge: 60_000 }
    )
  })
}

export async function reverseGeocodeToZip(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`Reverse geocode failed (${r.status})`)
  const data = await r.json()
  if (data.address?.country_code && data.address.country_code !== 'us') {
    throw new Error('Location is outside the US')
  }
  const raw = data.address?.postcode
  if (!raw) throw new Error('No ZIP code returned for this location')
  return String(raw).split('-')[0]
}
