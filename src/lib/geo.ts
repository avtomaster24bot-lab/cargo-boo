import { ALMATY_CENTER } from '../data/places'
import type { GeoPoint } from '../types'

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const OSRM = 'https://router.project-osrm.org/route/v1/driving'
const UA = 'CargoBoo/1.0 (https://github.com/avtomaster24bot-lab/cargo-boo)'

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function toRad(d: number): number {
  return (d * Math.PI) / 180
}

export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeoPoint[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const url = new URL(`${NOMINATIM}/search`)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', q)
  url.searchParams.set('countrycodes', 'kz')
  url.searchParams.set('accept-language', 'ru')
  url.searchParams.set('limit', '8')
  url.searchParams.set('viewbox', '76.6,43.5,77.3,43.05')
  url.searchParams.set('bounded', '0')
  const res = await fetch(url, { headers: { 'Accept-Language': 'ru', 'User-Agent': UA }, signal })
  if (!res.ok) throw new Error('search failed')
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[]
  return data.map((item) => ({
    lat: Number(item.lat),
    lng: Number(item.lon),
    address: tidyAddress(item.display_name),
  }))
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  const url = new URL(`${NOMINATIM}/reverse`)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('accept-language', 'ru')
  url.searchParams.set('zoom', '18')
  const res = await fetch(url, { headers: { 'Accept-Language': 'ru', 'User-Agent': UA }, signal })
  if (!res.ok) return `Точка ${lat.toFixed(5)}, ${lng.toFixed(5)}`
  const data = (await res.json()) as { display_name?: string }
  return data.display_name ? tidyAddress(data.display_name) : `Точка ${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export interface RouteResult {
  distanceKm: number
  durationMin: number
  path: [number, number][]
}

export async function routeOsrm(a: GeoPoint, b: GeoPoint, signal?: AbortSignal): Promise<RouteResult> {
  const url = `${OSRM}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return fallbackRoute(a, b)
    const data = (await res.json()) as {
      code?: string
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[]
    }
    const r = data.routes?.[0]
    if (!r) return fallbackRoute(a, b)
    return {
      distanceKm: r.distance / 1000,
      durationMin: r.duration / 60,
      path: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    }
  } catch {
    return fallbackRoute(a, b)
  }
}

function fallbackRoute(a: GeoPoint, b: GeoPoint): RouteResult {
  const distanceKm = haversineKm(a, b) * 1.35
  return {
    distanceKm,
    durationMin: (distanceKm / 28) * 60,
    path: [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ],
  }
}

export function tidyAddress(raw: string): string {
  return raw
    .replace(/, Казахстан$/, '')
    .replace(/, Kazakhstan$/i, '')
    .replace(/, Алматинская область/, '')
    .trim()
}

export { ALMATY_CENTER }
