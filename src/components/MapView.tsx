import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { ALMATY_CENTER } from '../data/places'
import type { Driver, GeoPoint } from '../types'

function pin(kind: 'from' | 'to' | 'car', label: string) {
  return L.divIcon({
    className: 'cb-marker-wrap',
    html: `<div class="cb-pin cb-pin-${kind}"><span>${label}</span></div>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
  })
}

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15, animate: true })
  }, [map, points])
  return null
}

function Clicker({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapView({
  pickup,
  dropoff,
  route = [],
  drivers = [],
  onMapClick,
  className = '',
}: {
  pickup?: GeoPoint | null
  dropoff?: GeoPoint | null
  route?: [number, number][]
  drivers?: Driver[]
  onMapClick?: (lat: number, lng: number) => void
  className?: string
}) {
  const center = pickup ?? dropoff ?? ALMATY_CENTER
  const points = useMemo(() => {
    if (route.length > 1) return route
    const pts: [number, number][] = []
    if (pickup) pts.push([pickup.lat, pickup.lng])
    if (dropoff) pts.push([dropoff.lat, dropoff.lng])
    return pts
  }, [pickup, dropoff, route])

  return (
    <div className={`overflow-hidden ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Fit points={points.length ? points : [[center.lat, center.lng]]} />
        <Clicker onClick={onMapClick} />
        {route.length > 1 && (
          <Polyline
            positions={route}
            pathOptions={{ color: '#0b7d6d', weight: 5, opacity: 0.9, lineJoin: 'round' }}
          />
        )}
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pin('from', 'A')} />}
        {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={pin('to', 'B')} />}
        {drivers.map((d) => (
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lng]}
            radius={8}
            pathOptions={{ color: '#12233a', fillColor: '#f5a524', fillOpacity: 1, weight: 2 }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
