import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Home, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, X, Calendar, MapPin, UserPlus } from 'lucide-react'
import { HouseVisitData } from './HouseVisitForm'

interface HouseVisitMarkersProps {
  visits: HouseVisitData[]
  onDeleteVisit: (visitId: string) => void
}

// Skapa custom ikoner för olika typer av besök
const createVisitIcon = (visitType: HouseVisitData['visitType'], doorKnockResult?: HouseVisitData['doorKnockResult']) => {
  let color = '#6b7280' // default gray
  let iconHtml = ''

  switch (visitType) {
    case 'hus':
      color = '#003366' // KD blue
      iconHtml = '🏠'
      break
    case 'knackat_dörr':
      if (doorKnockResult === 'positiv') {
        color = '#10b981' // green
        iconHtml = '👍'
      } else if (doorKnockResult === 'negativ') {
        color = '#ef4444' // red
        iconHtml = '👎'
      } else if (doorKnockResult === 'ville_inte_prata') {
        color = '#f59e0b' // yellow
        iconHtml = '🚪'
      } else {
        color = '#6b7280' // gray
        iconHtml = '🔒'
      }
      break
    case 'pratat_med_boende':
      color = '#8b5cf6' // purple
      iconHtml = '💬'
      break
    case 'partist':
      color = '#003366' // KD blue
      // Use KD logo for partist
      iconHtml = `<img src="https://kristdemokraterna.se/images/18.72d9f8c817e8ce3de0254710/1643616846958/KD-logo-blue.svg" style="width: 12px; height: 12px; filter: brightness(0) invert;" />`
      break
    case 'blev_medlem':
      color = '#FFD700' // KD gold
      iconHtml = '👤'
      break
  }

  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      ">
        ${iconHtml}
      </div>
    `,
    className: 'house-visit-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

export function HouseVisitMarkers({ visits, onDeleteVisit }: HouseVisitMarkersProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVisitTypeLabel = (visitType: HouseVisitData['visitType']) => {
    switch (visitType) {
      case 'hus':
        return 'Hus identifierat'
      case 'knackat_dörr':
        return 'Knackat dörr'
      case 'pratat_med_boende':
        return 'Pratat med boende'
      case 'partist':
        return 'KD-Partist'
      case 'blev_medlem':
        return 'Blev medlem'
      default:
        return visitType
    }
  }

  const getDoorKnockResultLabel = (result?: HouseVisitData['doorKnockResult']) => {
    if (!result) return null
    
    switch (result) {
      case 'boende_öppnade_inte':
        return 'Boende öppnade inte'
      case 'ville_inte_prata':
        return 'Ville inte prata'
      case 'positiv':
        return 'Positiv reaktion'
      case 'negativ':
        return 'Negativ reaktion'
      default:
        return result
    }
  }

  const getResultColor = (result?: HouseVisitData['doorKnockResult']) => {
    switch (result) {
      case 'positiv':
        return 'text-green-600'
      case 'negativ':
        return 'text-red-600'
      case 'ville_inte_prata':
        return 'text-yellow-600'
      case 'boende_öppnade_inte':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <>
      {visits.map((visit) => (
        <Marker
          key={visit.id}
          position={[visit.position.lat, visit.position.lng]}
          icon={createVisitIcon(visit.visitType, visit.doorKnockResult)}
        >
          <Popup className="house-visit-popup" maxWidth={300}>
            <div className="p-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#003366] flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Husbesök
                </h3>
                <button
                  onClick={() => onDeleteVisit(visit.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Ta bort besök"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Visit Type */}
              <div className="mb-2">
                <span className="text-sm font-medium text-[#003366]">Typ: </span>
                <span className="text-sm text-gray-900">{getVisitTypeLabel(visit.visitType)}</span>
              </div>

              {/* Door Knock Result */}
              {visit.doorKnockResult && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-[#003366]">Resultat: </span>
                  <span className={`text-sm font-medium ${getResultColor(visit.doorKnockResult)}`}>
                    {getDoorKnockResultLabel(visit.doorKnockResult)}
                  </span>
                </div>
              )}

              {/* Address */}
              {visit.address && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-[#003366]">Adress: </span>
                  <span className="text-sm text-gray-900">{visit.address}</span>
                </div>
              )}

              {/* Position */}
              <div className="mb-2 flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {visit.position.lat.toFixed(6)}, {visit.position.lng.toFixed(6)}
                </span>
              </div>

              {/* Timestamp */}
              <div className="mb-3 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {formatTimestamp(visit.timestamp)}
                </span>
              </div>

              {/* Notes */}
              {visit.notes && (
                <div className="border-t pt-2">
                  <span className="text-sm font-medium text-[#003366]">Anteckningar:</span>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{visit.notes}</p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}