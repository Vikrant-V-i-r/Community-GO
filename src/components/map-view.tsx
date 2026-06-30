'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Issue } from '@/lib/types'
import { STATUS_META, CATEGORY_META } from '@/lib/constants'

// Fix default marker icon path issues with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// Build a custom Pokestop-style divIcon: colored circle with emoji + pulsing ring for FRESH
function makePokestopIcon(issue: Issue) {
  const meta = STATUS_META[issue.status]
  const cat = CATEGORY_META[issue.category]
  const pulse = meta.pulse
  const size = issue.severity === 'CRITICAL' ? 52 : issue.severity === 'HIGH' ? 46 : 40

  return L.divIcon({
    className: 'pokestop-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse ? `<div style="position:absolute;inset:-6px;border-radius:9999px;background:${meta.color};opacity:0.35;animation:pokepulse 1.6s ease-out infinite;"></div>` : ''}
        <div style="
          position:absolute;inset:0;border-radius:9999px;
          background:radial-gradient(circle at 30% 30%, ${meta.color}, ${meta.color}cc);
          border:3px solid white;
          box-shadow:0 0 0 2px ${meta.color}, 0 6px 14px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.5}px;line-height:1;
        ">${cat.emoji}</div>
        ${
          issue.status === 'SOLVED'
            ? `<div style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#16a34a;border:2px solid white;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:900;">✓</div>`
            : ''
        }
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function UserLocationMarker({ position }: { position: [number, number] | null }) {
  if (!position) return null
  return (
    <>
      <Circle center={position} radius={120} pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.08 }} />
      <Circle center={position} radius={40} pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.15 }} />
      <Marker
        position={position}
        icon={L.divIcon({
          className: 'user-marker',
          html: `
            <div style="position:relative;width:36px;height:36px;">
              <div style="position:absolute;inset:-6px;border-radius:9999px;background:#f43f5e;opacity:0.3;animation:pokepulse 2s ease-out infinite;"></div>
              <div style="
                position:absolute;inset:0;border-radius:9999px;
                background:linear-gradient(135deg,#f43f5e,#f59e0b);
                border:3px solid white;
                box-shadow:0 0 0 2px #f43f5e, 0 6px 14px rgba(0,0,0,0.4);
                display:flex;align-items:center;justify-content:center;
                font-size:18px;line-height:1;
              ">🦸</div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })}
      >
        <Popup>
          <div className="text-sm font-semibold">You (demo) — Bengaluru</div>
          <div className="text-xs text-slate-500">All issues are seeded around this city</div>
        </Popup>
      </Marker>
    </>
  )
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 1.2 })
  }, [target, map])
  return null
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 14)
  }, [map, center])
  return null
}

export interface MapViewProps {
  issues: Issue[]
  userPos: [number, number] | null
  center: [number, number]
  selectedIssueId: string | null
  onSelectIssue: (id: string) => void
  flyTo: [number, number] | null
  onFlyDone: () => void
}

export default function MapView({
  issues, userPos, center, selectedIssueId, onSelectIssue, flyTo, onFlyDone,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo(flyTo, 16, { duration: 1.2 })
      const t = setTimeout(onFlyDone, 1400)
      return () => clearTimeout(t)
    }
  }, [flyTo, onFlyDone])

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={center}
        zoom={14}
        minZoom={11}
        maxZoom={18}
        zoomControl={false}
        attributionControl={false}
        className="absolute inset-0 h-full w-full"
        ref={(m) => { mapRef.current = m }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <Recenter center={center} />

        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={makePokestopIcon(issue)}
            eventHandlers={{ click: () => onSelectIssue(issue.id) }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-bold text-sm mb-1">{issue.title.slice(0, 80)}</div>
                <div className="text-xs text-slate-600">{issue.address}</div>
                <button
                  onClick={() => onSelectIssue(issue.id)}
                  className="mt-2 w-full rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  View Issue Card →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        <UserLocationMarker position={userPos} />
      </MapContainer>

      <style jsx global>{`
        @keyframes pokepulse {
          0% { transform: scale(0.8); opacity: 0.55; }
          80% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
        }
        .leaflet-popup-content { margin: 12px !important; }
      `}</style>
    </div>
  )
}
