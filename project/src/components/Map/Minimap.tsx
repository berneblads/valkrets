import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MinimapProps {
  position: { lat: number, lng: number }
  address?: string
  className?: string
}

// Create a custom red marker icon
const createRedMarker = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #dc2626;
        width: 20px;
        height: 20px;
        border-radius: 50% 50% 50% 0;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: 'minimap-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20]
  })
}

export function Minimap({ position, address, className = '' }: MinimapProps) {
  const mapRef = useRef<L.Map | null>(null)

  // Custom component to handle map instance
  const MapHandler = () => {
    const map = mapRef.current
    
    useEffect(() => {
      if (map) {
        // Set view to the position
        map.setView([position.lat, position.lng], 16)
        
        // Disable all interactions to make it a static minimap
        map.dragging.disable()
        map.touchZoom.disable()
        map.doubleClickZoom.disable()
        map.scrollWheelZoom.disable()
        map.boxZoom.disable()
        map.keyboard.disable()
        if (map.tap) map.tap.disable()
        
        // Note: zoom control is already disabled via zoomControl={false} prop
        // so we don't need to remove it here
      }
    }, [map, position])

    return null
  }

  return (
    <div className={`minimap-container ${className}`}>
      <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={16}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
          whenReady={(mapInstance) => {
            mapRef.current = mapInstance.target
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <Marker
            position={[position.lat, position.lng]}
            icon={createRedMarker()}
          />
          
          <MapHandler />
        </MapContainer>
      </div>
      
      {address && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          <div className="flex items-center justify-center space-x-1">
            <span className="inline-block w-2 h-2 bg-red-600 rounded-full"></span>
            <span>{address}</span>
          </div>
        </div>
      )}
    </div>
  )
}