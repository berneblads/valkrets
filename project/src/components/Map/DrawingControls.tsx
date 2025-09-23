import React, { useState, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import { Edit, Square, Trash2, Save, X, MapPin, Route, Circle, Home, Palette, Users } from 'lucide-react'
import { HouseVisitForm, HouseVisitData } from './HouseVisitForm'
import { teamService } from '../../lib/teamService'
import { campaignService } from '../../lib/campaignService'

interface DrawingControlsProps {
  onAreaCreated: (geoJson: any, name: string, type: string, description: string, color: string) => void
  onHouseVisitCreated: (visitData: HouseVisitData) => void
  isDrawing: boolean
  onDrawingToggle: () => void
  houseVisitMode: boolean
  onHouseVisitModeToggle: () => void
}

// Fördefinierade färger för snabb åtkomst
const presetColors = [
  '#003366', // KD blue
  '#FFD700', // KD gold
  '#60a5fa', // blue
  '#f87171', // red
  '#34d399', // green
  '#fbbf24', // yellow
  '#a78bfa', // purple
  '#22d3ee', // cyan
  '#a3e635', // lime
  '#f97316', // orange
  '#8b5cf6'  // violet
]

// Default färger för olika objekttyper
const getDefaultColor = (type: string): string => {
  const colors: Record<string, string> = {
    kampanjområde: '#003366', // KD blue
    rutt: '#f87171',
    mötesplats: '#34d399',
    viktigt_område: '#fbbf24',
    undvik_område: '#9ca3af',
    samlingspunkt: '#a78bfa',
    parkering: '#22d3ee',
    toalett: '#a3e635'
  }
  return colors[type] || '#003366'
}

export function DrawingControls({ 
  onAreaCreated, 
  onHouseVisitCreated, 
  isDrawing, 
  onDrawingToggle,
  houseVisitMode,
  onHouseVisitModeToggle
}: DrawingControlsProps) {
  const map = useMap()
  const drawControlRef = useRef<L.Control.Draw | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup())
  const [showForm, setShowForm] = useState(false)
  const [showHouseVisitForm, setShowHouseVisitForm] = useState(false)
  const [currentGeoJson, setCurrentGeoJson] = useState<any>(null)
  const [currentMarkerPosition, setCurrentMarkerPosition] = useState<{ lat: number, lng: number } | null>(null)
  const [tempMarker, setTempMarker] = useState<L.Marker | null>(null)
  const [hasUnsavedMarker, setHasUnsavedMarker] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'kampanjområde',
    description: '',
    color: '#003366', // Default KD blue
    teamId: ''
  })
  const [teams, setTeams] = useState<{ value: string; label: string; color: string }[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [campaignTypes, setCampaignTypes] = useState<{ value: string; label: string; color: string }[]>([])
  const [loadingCampaignTypes, setLoadingCampaignTypes] = useState(true)

  // Load teams and campaign types
  useEffect(() => {
    loadTeams()
    loadCampaignTypes()
  }, [])

  const loadTeams = async () => {
    try {
      setLoadingTeams(true)
      const teamOptions = await teamService.getTeamOptions()
      setTeams(teamOptions)
    } catch (error) {
      console.error('Error loading teams:', error)
      setTeams([])
    } finally {
      setLoadingTeams(false)
    }
  }

  const loadCampaignTypes = async () => {
    try {
      setLoadingCampaignTypes(true)
      const typeOptions = await campaignService.getCampaignTypeOptions()
      setCampaignTypes(typeOptions)
    } catch (error) {
      console.error('Error loading campaign types:', error)
      setCampaignTypes([])
    } finally {
      setLoadingCampaignTypes(false)
    }
  }

  // Helper function to check if a control is added to the map
  const isControlOnMap = (control: L.Control) => {
    if (!map || !control) return false
    
    // Check if hasControl method exists and use it
    if (typeof map.hasControl === 'function') {
      return map.hasControl(control)
    }
    
    // Fallback: check if the control's container is in the DOM
    try {
      const container = control.getContainer?.()
      return container && container.parentNode !== null
    } catch (error) {
      // If we can't determine, assume it's not on the map
      return false
    }
  }

  useEffect(() => {
    if (!map) return

    // Lägg till drawnItems till kartan
    if (!map.hasLayer(drawnItemsRef.current)) {
      map.addLayer(drawnItemsRef.current)
    }

    // Skapa draw control med alla verktyg - använd standard färger under ritning
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Fel!</strong> Polygonen får inte korsa sig själv!'
          },
          shapeOptions: {
            color: '#003366', // KD blue under ritning
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3
          },
          showMeasurements: false,
          metric: false,
          feet: false
        },
        rectangle: {
          shapeOptions: {
            color: '#003366', // KD blue under ritning
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3
          },
          showMeasurements: false,
          metric: false,
          feet: false
        },
        circle: {
          shapeOptions: {
            color: '#003366', // KD blue under ritning
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3
          },
          showMeasurements: false,
          metric: false,
          feet: false
        },
        polyline: {
          shapeOptions: {
            color: '#003366', // KD blue under ritning
            weight: 4,
            opacity: 0.8
          },
          showMeasurements: false,
          metric: false,
          feet: false,
          nautic: false,
          // Förbättrade inställningar för polyline
          allowIntersection: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Tips:</strong> Dubbelklicka för att avsluta linjen!'
          },
          // Gör markörer mindre och mer synliga
          icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon'
          }),
          touchIcon: new L.DivIcon({
            iconSize: new L.Point(12, 12),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
          })
        },
        marker: false, // Disable default marker
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: true
      }
    })

    drawControlRef.current = drawControl

    // Event handlers
    const onDrawCreated = (e: any) => {
      try {
        const layer = e.layer
        if (!layer) {
          console.error('No layer in draw created event')
          return
        }

        drawnItemsRef.current.addLayer(layer)
        
        // Konvertera till GeoJSON
        const geoJson = layer.toGeoJSON()
        if (!geoJson) {
          console.error('Failed to convert layer to GeoJSON')
          return
        }

        setCurrentGeoJson(geoJson)
        
        // Sätt default färg baserat på objekttyp
        setFormData(prev => ({
          ...prev,
          color: getDefaultColor(prev.type)
        }))
        
        setShowForm(true)
      } catch (error) {
        console.error('Error in draw created handler:', error)
      }
    }

    const onDrawStart = (e: any) => {
      // Lägg till extra instruktioner för polyline
      if (e.layerType === 'polyline') {
        console.log('Polyline ritning startad - dubbelklicka för att avsluta')
        // Visa tooltip med instruktioner
        const tooltip = document.createElement('div')
        tooltip.className = 'polyline-instruction-tooltip'
        tooltip.innerHTML = 'Dubbelklicka för att avsluta linjen'
        tooltip.style.cssText = `
          position: fixed;
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
        `
        document.body.appendChild(tooltip)
        
        // Ta bort tooltip efter 3 sekunder
        setTimeout(() => {
          if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip)
          }
        }, 3000)
      }
    }

    const onDrawStop = (e: any) => {
      // Rensa eventuella tooltips
      const tooltips = document.querySelectorAll('.polyline-instruction-tooltip')
      tooltips.forEach(tooltip => {
        if (document.body.contains(tooltip)) {
          document.body.removeChild(tooltip)
        }
      })
    }

    const onDrawEdited = (e: any) => {
      console.log('Områden redigerade:', e.layers)
    }

    const onDrawDeleted = (e: any) => {
      console.log('Områden borttagna:', e.layers)
    }

    // Lägg till event listeners
    map.on(L.Draw.Event.CREATED, onDrawCreated)
    map.on(L.Draw.Event.DRAWSTART, onDrawStart)
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop)
    map.on(L.Draw.Event.EDITED, onDrawEdited)
    map.on(L.Draw.Event.DELETED, onDrawDeleted)

    return () => {
      // Cleanup
      map.off(L.Draw.Event.CREATED, onDrawCreated)
      map.off(L.Draw.Event.DRAWSTART, onDrawStart)
      map.off(L.Draw.Event.DRAWSTOP, onDrawStop)
      map.off(L.Draw.Event.EDITED, onDrawEdited)
      map.off(L.Draw.Event.DELETED, onDrawDeleted)
      
      if (map.hasLayer(drawnItemsRef.current)) {
        map.removeLayer(drawnItemsRef.current)
      }
      
      if (drawControl && isControlOnMap(drawControl)) {
        try {
          map.removeControl(drawControl)
        } catch (error) {
          console.error('Error removing draw control:', error)
        }
      }
    }
  }, [map])

  // Uppdatera draw control när ritläge ändras
  useEffect(() => {
    if (!drawControlRef.current || !map) return

    try {
      if (isDrawing && !houseVisitMode) {
        if (!isControlOnMap(drawControlRef.current)) {
          map.addControl(drawControlRef.current)
        }
      } else {
        if (isControlOnMap(drawControlRef.current)) {
          map.removeControl(drawControlRef.current)
        }
      }
    } catch (error) {
      console.error('Error updating draw control:', error)
    }
  }, [isDrawing, houseVisitMode, map])

  // Uppdatera färg när typ ändras
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      color: getDefaultColor(prev.type)
    }))
  }, [formData.type])

  const handleSaveArea = () => {
    if (currentGeoJson && formData.name.trim() && formData.type && formData.color) {
      onAreaCreated(currentGeoJson, formData.name.trim(), formData.type, formData.description.trim(), formData.color)
      setShowForm(false)
      setCurrentGeoJson(null)
      setFormData({ 
        name: '', 
        type: 'kampanjområde', 
        description: '',
        color: '#003366',
        teamId: ''
      })
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setCurrentGeoJson(null)
    setFormData({ 
      name: '', 
      type: 'kampanjområde', 
      description: '',
      color: '#003366',
      teamId: ''
    })
    
    // Ta bort det senast ritade objektet
    const layers = drawnItemsRef.current.getLayers()
    if (layers.length > 0) {
      drawnItemsRef.current.removeLayer(layers[layers.length - 1])
    }
  }

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }))
  }

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ 
      ...prev, 
      type,
      color: getDefaultColor(type) // Automatiskt sätt färg baserat på typ
    }))
  }

  const handleTeamChange = (teamId: string) => {
    setFormData(prev => ({ ...prev, teamId }))
    
    // If a team is selected, update the color to match the team color
    if (teamId) {
      const selectedTeam = teams.find(team => team.value === teamId)
      if (selectedTeam) {
        setFormData(prev => ({ ...prev, color: selectedTeam.color }))
      }
    }
  }

  // Helper function to remove temporary marker
  const removeTempMarker = () => {
    if (tempMarker && map && map.hasLayer(tempMarker)) {
      map.removeLayer(tempMarker)
      setTempMarker(null)
    }
  }

  // Handle house visit marker placement with validation
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!houseVisitMode) return
    
    // Block marker placement if there's already an unsaved marker
    if (hasUnsavedMarker) {
      console.warn('Cannot place marker: unsaved marker exists')
      return
    }

    // Capture the exact click position immediately
    const clickPosition = { lat: e.latlng.lat, lng: e.latlng.lng }
    setCurrentMarkerPosition(clickPosition)
    
    // Remove any existing temporary marker
    removeTempMarker()
    
    // Create and place temporary marker immediately
    const newTempMarker = L.marker([clickPosition.lat, clickPosition.lng], {
      icon: L.divIcon({
        html: `
          <div style="
            background-color: #003366;
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
            🏠
          </div>
        `,
        className: 'temp-house-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    })
    
    map.addLayer(newTempMarker)
    setTempMarker(newTempMarker)
    setHasUnsavedMarker(true)
    setShowHouseVisitForm(true)
  }

  // Add map click listener for house visit markers with validation
  useEffect(() => {
    if (!map) return

    if (houseVisitMode) {
      map.on('click', handleMapClick)
      // Change cursor to indicate house visit mode
      map.getContainer().style.cursor = hasUnsavedMarker ? 'not-allowed' : 'crosshair'
    } else {
      map.off('click', handleMapClick)
      // Reset cursor
      map.getContainer().style.cursor = ''
    }

    return () => {
      map.off('click', handleMapClick)
      map.getContainer().style.cursor = ''
    }
  }, [map, houseVisitMode, hasUnsavedMarker])

  const handleHouseVisitSave = (visitData: HouseVisitData) => {
    onHouseVisitCreated(visitData)
    setShowHouseVisitForm(false)
    setCurrentMarkerPosition(null)
    
    // Remove temporary marker and reset state
    removeTempMarker()
    setHasUnsavedMarker(false)
  }

  const handleHouseVisitCancel = () => {
    setShowHouseVisitForm(false)
    setCurrentMarkerPosition(null)
    
    // Remove temporary marker and reset state
    removeTempMarker()
    setHasUnsavedMarker(false)
  }

  return (
    <>
      {/* Area Information Form - Nu med färgväljare direkt i formuläret */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-[#003366]">Nytt kampanjobjekt</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="objectName" className="block text-sm font-medium text-[#003366] mb-1">
                  Namn *
                </label>
                <input
                  id="objectName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="t.ex. Malmö Centrum Runda"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="objectType" className="block text-sm font-medium text-[#003366] mb-1">
                  Typ *
                </label>
                <select
                  id="objectType"
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  required
                >
                  <option value="kampanjområde">Kampanjområde</option>
                  <option value="rutt">Kampanjrutt</option>
                  <option value="mötesplats">Mötesplats</option>
                  <option value="viktigt_område">Viktigt område</option>
                  <option value="undvik_område">Område att undvika</option>
                  <option value="samlingspunkt">Samlingspunkt</option>
                  <option value="parkering">Parkering</option>
                  <option value="toalett">Toalett/Vila</option>
                </select>
              </div>

              {/* Team Assignment */}
              <div>
                <label htmlFor="teamAssignment" className="block text-sm font-medium text-[#003366] mb-1">
                  Tilldela team
                </label>
                {loadingTeams ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Laddar teams...
                  </div>
                ) : (
                  <select
                    id="teamAssignment"
                    value={formData.teamId}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  >
                    <option value="">Inget team</option>
                    {teams.map(team => (
                      <option key={team.value} value={team.value}>{team.label}</option>
                    ))}
                    <option value="create_new">+ Skapa nytt team</option>
                  </select>
                )}
              </div>

              {/* Färgväljare - Nu direkt i formuläret */}
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-2">
                  Färg *
                </label>
                
                {/* Färgförhandsvisning */}
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-16 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-sm text-gray-600 font-mono">{formData.color}</span>
                </div>

                {/* Fördefinierade färger */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {presetColors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                        formData.color === color 
                          ? 'border-[#003366] shadow-lg' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Färg ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Anpassad färgväljare */}
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] font-mono text-sm"
                    placeholder="#003366"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="objectDescription" className="block text-sm font-medium text-[#003366] mb-1">
                  Beskrivning
                </label>
                <textarea
                  id="objectDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Beskriv vad som ska göras här..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelForm}
                className="px-4 py-2 text-[#003366] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSaveArea}
                disabled={!formData.name.trim() || !formData.type || !formData.color}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Spara</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* House Visit Form */}
      {showHouseVisitForm && currentMarkerPosition && (
        <HouseVisitForm
          position={currentMarkerPosition}
          onSave={handleHouseVisitSave}
          onCancel={handleHouseVisitCancel}
        />
      )}
    </>
  )
}