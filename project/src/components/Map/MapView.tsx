import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'
import { geoDataService, DistrictData, MunicipalityData } from '../../lib/geoDataService'
import { DrawingControls } from './DrawingControls'
import { DrawnObjectsPanel } from './DrawnObjectsPanel'
import { HouseVisitMarkers } from './HouseVisitMarkers'
import { HouseVisitData } from './HouseVisitForm'
import { AreaInfoPopup } from './AreaInfoPopup'
import { Layers, Edit, AlertTriangle, RefreshCw, Home, X, Map as MapIcon } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Team-färger - KD-anpassade färger
const teamColors: Record<string, string> = {
  'Team A': '#003366', // KD blue
  'Team B': '#FFD700', // KD gold
  'Team C': '#4A90E2', // lighter blue
  'Ej tilldelad': '#9ca3af' // gray
}

interface DrawnObject {
  id: string
  name: string
  type: string
  description: string
  geoJson: any
  visible: boolean
  color: string
  teamAssignment?: string
  created_at: string
  updated_at: string
}

interface MapViewProps {
  municipalities?: MunicipalityData[]
  districts?: DistrictData[]
  selectedMunicipality?: string
  selectedDistrict?: string
  onMunicipalityChange?: (code: string) => void
  onDistrictChange?: (name: string) => void
  onTeamAssignment?: (districtName: string, team: string) => void
  selectedDistrictInfo?: DistrictData | null
  houseVisits?: HouseVisitData[]
  onHouseVisitCreated?: (visitData: HouseVisitData) => void
  onDeleteHouseVisit?: (visitId: string) => void
  drawnObjects?: DrawnObject[]
  onAreaCreated?: (geoJson: any, name: string, type: string, description: string, color: string) => void
  onToggleObjectVisibility?: (id: string) => void
  onDeleteObject?: (id: string) => void
  onEditObject?: (id: string) => void
  onObjectTeamAssignment?: (objectId: string, team: string) => void
  onObjectColorChange?: (objectId: string, color: string) => void
}

// Map style options
const mapStyles = [
  {
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
  },
  {
    name: 'Transport',
    url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38',
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'Landscape',
    url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38',
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
]

// Component to handle GeoJSON click events
function GeoJSONWithEvents({ 
  data, 
  style, 
  onClick,
  areaId,
  areaName,
  areaType
}: { 
  data: any, 
  style: any, 
  onClick: () => void,
  areaId: string,
  areaName: string,
  areaType: string
}) {
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  
  const mapEvents = useMapEvents({
    click: (e) => {
      // Check if click was on this GeoJSON
      const clickPoint = e.latlng
      const layer = mapEvents.leafletElement
      
      // This is a simplistic check - in a real app you'd use a proper point-in-polygon algorithm
      // or Leaflet's built-in methods to check if the click was on this layer
      if (layer && layer.getBounds && layer.getBounds().contains(clickPoint)) {
        setShowInfoPopup(true)
      }
    }
  })

  return (
    <>
      <GeoJSON data={data} style={style} eventHandlers={{ click: onClick }} />
      
      {showInfoPopup && (
        <AreaInfoPopup 
          areaId={areaId}
          areaName={areaName}
          areaType={areaType}
          onClose={() => setShowInfoPopup(false)}
        />
      )}
    </>
  )
}

export function MapView({
  municipalities: propMunicipalities,
  districts: propDistricts,
  selectedMunicipality: propSelectedMunicipality,
  selectedDistrict: propSelectedDistrict,
  onMunicipalityChange: propOnMunicipalityChange,
  onDistrictChange: propOnDistrictChange,
  onTeamAssignment: propOnTeamAssignment,
  selectedDistrictInfo: propSelectedDistrictInfo,
  houseVisits: propHouseVisits = [],
  onHouseVisitCreated: propOnHouseVisitCreated,
  onDeleteHouseVisit: propOnDeleteHouseVisit,
  drawnObjects: propDrawnObjects = [],
  onAreaCreated: propOnAreaCreated,
  onToggleObjectVisibility: propOnToggleObjectVisibility,
  onDeleteObject: propOnDeleteObject,
  onEditObject: propOnEditObject,
  onObjectTeamAssignment: propOnObjectTeamAssignment,
  onObjectColorChange: propOnObjectColorChange
}: MapViewProps) {
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>(propMunicipalities || [])
  const [districts, setDistricts] = useState<DistrictData[]>(propDistricts || [])
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>(propSelectedMunicipality || '')
  const [selectedDistrict, setSelectedDistrict] = useState<string>(propSelectedDistrict || '')
  const [highlightedDistrict, setHighlightedDistrict] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawnObjects, setDrawnObjects] = useState<DrawnObject[]>(propDrawnObjects)
  const [houseVisits, setHouseVisits] = useState<HouseVisitData[]>(propHouseVisits)
  const [showObjectsPanel, setShowObjectsPanel] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [houseVisitMode, setHouseVisitMode] = useState(false)
  const [currentZoom, setCurrentZoom] = useState<number>(8)
  const [currentMapStyle, setCurrentMapStyle] = useState(0)
  const [showMapStyleDropdown, setShowMapStyleDropdown] = useState(false)
  const [selectedObject, setSelectedObject] = useState<{id: string, name: string, type: string} | null>(null)
  
  // Förbättrad zoom-hantering - spåra när användaren zoomar manuellt
  const userIsZooming = useRef(false)
  const lastUserZoomTime = useRef(0)
  const programmaticZoom = useRef(false)
  const lastSelectionTime = useRef(0)
  const lastClickTime = useRef(0)

  // Skåne bounds - mer exakta koordinater
  const skaneBounds = new LatLngBounds(
    [55.3, 12.5], // Southwest
    [56.5, 14.5]  // Northeast
  )

  // Fallback center för Skåne
  const skaneCenter: [number, number] = [55.9, 13.5]

  // Synka med props
  useEffect(() => {
    if (propMunicipalities) setMunicipalities(propMunicipalities)
  }, [propMunicipalities])

  useEffect(() => {
    if (propDistricts) setDistricts(propDistricts)
  }, [propDistricts])

  useEffect(() => {
    if (propSelectedMunicipality !== undefined) {
      setSelectedMunicipality(propSelectedMunicipality)
      // Uppdatera highlighted district när kommun ändras
      if (!propSelectedMunicipality) {
        setHighlightedDistrict(null)
      }
    }
  }, [propSelectedMunicipality])

  useEffect(() => {
    if (propSelectedDistrict !== undefined) {
      setSelectedDistrict(propSelectedDistrict)
      // Synkronisera highlighted district med selected district
      setHighlightedDistrict(propSelectedDistrict || null)
    }
  }, [propSelectedDistrict])

  useEffect(() => {
    if (propHouseVisits) {
      setHouseVisits(propHouseVisits)
    }
  }, [propHouseVisits])

  useEffect(() => {
    if (propDrawnObjects) {
      setDrawnObjects(propDrawnObjects)
    }
  }, [propDrawnObjects])

  useEffect(() => {
    loadInitialData()
  }, [])

  // Förbättrad zoom-hantering
  useEffect(() => {
    if (mapInstance) {
      const handleZoomStart = () => {
        // Markera att användaren zoomar om det inte är programmatisk zoom
        if (!programmaticZoom.current) {
          userIsZooming.current = true
          lastUserZoomTime.current = Date.now()
          console.log('🔍 Användaren startar manuell zoom')
        }
      }

      const handleZoomEnd = () => {
        const zoom = mapInstance.getZoom()
        setCurrentZoom(zoom)
        
        // Reset programmatic zoom flag
        if (programmaticZoom.current) {
          console.log('🎯 Programmatisk zoom avslutad')
          programmaticZoom.current = false
        } else {
          console.log('🔍 Manuell zoom avslutad, zoom:', zoom)
        }
        
        // Reset user zooming flag efter en kort delay
        setTimeout(() => {
          userIsZooming.current = false
        }, 100)
      }

      mapInstance.on('zoomstart', handleZoomStart)
      mapInstance.on('zoomend', handleZoomEnd)
      
      return () => {
        mapInstance.off('zoomstart', handleZoomStart)
        mapInstance.off('zoomend', handleZoomEnd)
      }
    }
  }, [mapInstance])

  // Zoom till kommun - med initial zoom men respekterar användarens zoom
  useEffect(() => {
    if (mapInstance && selectedMunicipality && municipalities.length > 0) {
      const municipality = municipalities.find(m => m.code === selectedMunicipality)
      if (municipality && municipality.geojson && municipality.geojson.geometry) {
        try {
          const geoJsonLayer = L.geoJSON(municipality.geojson)
          const bounds = geoJsonLayer.getBounds()
          if (bounds.isValid()) {
            // Kontrollera om användaren nyligen zoomat manuellt (inom 2 sekunder)
            const timeSinceUserZoom = Date.now() - lastUserZoomTime.current
            const timeSinceSelection = Date.now() - lastSelectionTime.current
            const timeSinceClick = Date.now() - lastClickTime.current
            const shouldZoom = !userIsZooming.current && timeSinceUserZoom > 2000 && (timeSinceSelection > 500 || timeSinceClick > 500)
            
            if (shouldZoom) {
              programmaticZoom.current = true
              mapInstance.fitBounds(bounds, { padding: [20, 20] })
              console.log(`🎯 Zoomade till kommun: ${municipality.name}`)
            } else {
              console.log(`📍 Kommun vald utan zoom: ${municipality.name} (användaren kontrollerar zoom)`)
            }
          }
        } catch (error) {
          console.error('Fel vid zoom till kommun:', error)
        }
      }
    }
  }, [mapInstance, selectedMunicipality, municipalities])

  // Zoom till valdistrikt - med initial zoom men respekterar användarens zoom
  useEffect(() => {
    if (mapInstance && selectedDistrict && districts.length > 0) {
      const district = districts.find(d => d.name === selectedDistrict)
      if (district && district.geojson && district.geojson.geometry) {
        try {
          const geoJsonLayer = L.geoJSON(district.geojson)
          const bounds = geoJsonLayer.getBounds()
          if (bounds.isValid()) {
            // Kontrollera om användaren nyligen zoomat manuellt (inom 2 sekunder)
            const timeSinceUserZoom = Date.now() - lastUserZoomTime.current
            const timeSinceSelection = Date.now() - lastSelectionTime.current
            const timeSinceClick = Date.now() - lastClickTime.current
            const shouldZoom = !userIsZooming.current && timeSinceUserZoom > 2000 && (timeSinceSelection > 500 || timeSinceClick > 500)
            
            if (shouldZoom) {
              programmaticZoom.current = true
              mapInstance.fitBounds(bounds, { padding: [50, 50] })
              console.log(`🎯 Zoomade till valdistrikt: ${district.name}`)
            } else {
              console.log(`📍 Valdistrikt valt utan zoom: ${district.name} (användaren kontrollerar zoom)`)
            }
          }
        } catch (error) {
          console.error('Fel vid zoom till valdistrikt:', error)
        }
      }
    }
  }, [mapInstance, selectedDistrict, districts])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🗺️ Startar laddning av kartdata...')
      
      // Testa nätverksanslutning först
      try {
        await fetch('https://tile.openstreetmap.org/0/0/0.png', { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache'
        })
        console.log('✅ Nätverksanslutning OK')
      } catch (networkError) {
        console.warn('⚠️ Nätverksanslutning kan vara begränsad:', networkError)
      }

      // Ladda endast om vi inte redan har data från props
      if (!propMunicipalities || propMunicipalities.length === 0) {
        const municipalitiesData = await geoDataService.loadMunicipalities()
        
        if (!municipalitiesData || municipalitiesData.length === 0) {
          throw new Error('Inga kommuner kunde laddas från GitHub')
        }
        
        setMunicipalities(municipalitiesData)
        console.log(`✅ ${municipalitiesData.length} kommuner laddade`)
      }
      
      // Ladda team-tilldelningar
      geoDataService.loadTeamAssignments()
      console.log('✅ Team-tilldelningar laddade')
      
      setMapReady(true)
    } catch (error) {
      console.error('❌ Fel vid laddning av initial data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Okänt fel vid laddning av data'
      setError(errorMessage)
      
      // Automatisk retry efter 3 sekunder (max 3 försök)
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadInitialData()
        }, 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMunicipalityChange = async (municipalityCode: string) => {
    // Registrera selektionstid för att undvika konflikt med användarens zoom
    lastSelectionTime.current = Date.now()
    
    setSelectedMunicipality(municipalityCode)
    setSelectedDistrict('')
    setHighlightedDistrict(null)
    
    if (propOnMunicipalityChange) {
      propOnMunicipalityChange(municipalityCode)
    }
    
    if (municipalityCode) {
      try {
        setError(null)
        console.log(`🏛️ Laddar valdistrikt för kommun: ${municipalityCode}`)
        
        const districtsData = await geoDataService.loadDistricts(municipalityCode)
        
        if (!districtsData || districtsData.length === 0) {
          console.warn('⚠️ Inga valdistrikt hittades för denna kommun')
          setDistricts([])
          return
        }
        
        const districtsWithResults = await geoDataService.combineDistrictsWithResults(districtsData)
        setDistricts(districtsWithResults)
        console.log(`✅ ${districtsWithResults.length} valdistrikt laddade`)
      } catch (error) {
        console.error('❌ Fel vid laddning av valdistrikt:', error)
        setError('Kunde inte ladda valdistrikt för denna kommun')
        setDistricts([])
      }
    } else {
      setDistricts([])
    }
  }

  const handleDistrictChange = (districtName: string) => {
    // Registrera selektionstid för att undvika konflikt med användarens zoom
    lastSelectionTime.current = Date.now()
    
    setSelectedDistrict(districtName)
    setHighlightedDistrict(districtName || null)
    
    if (propOnDistrictChange) {
      propOnDistrictChange(districtName)
    }
  }

  const handleDistrictClick = (districtName: string) => {
    if (!isDrawing && !houseVisitMode) {
      // Registrera klicktid för att undvika konflikt med användarens zoom
      lastClickTime.current = Date.now()
      
      setSelectedDistrict(districtName)
      setHighlightedDistrict(districtName)
      
      if (propOnDistrictChange) {
        propOnDistrictChange(districtName)
      }
      
      console.log(`📍 Valdistrikt klickat: ${districtName}`)
    }
  }

  const handleMunicipalityClick = (municipalityCode: string) => {
    if (!isDrawing && !houseVisitMode) {
      // Registrera klicktid för att undvika konflikt med användarens zoom
      lastClickTime.current = Date.now()
      
      handleMunicipalityChange(municipalityCode)
      
      console.log(`📍 Kommun klickad: ${municipalityCode}`)
    }
  }

  const handleTeamAssignment = (districtName: string, team: string) => {
    geoDataService.assignTeamToDistrict(districtName, team)
    
    // Uppdatera local state
    setDistricts(prev => prev.map(d => 
      d.name === districtName 
        ? { ...d, teamAssignment: team }
        : d
    ))
    
    if (propOnTeamAssignment) {
      propOnTeamAssignment(districtName, team)
    }
  }

  const handleAreaCreated = (geoJson: any, name: string, type: string, description: string, color: string) => {
    if (propOnAreaCreated) {
      propOnAreaCreated(geoJson, name, type, description, color)
    }
  }

  const handleHouseVisitCreated = (visitData: HouseVisitData) => {
    if (propOnHouseVisitCreated) {
      propOnHouseVisitCreated(visitData)
    } else {
      const updatedVisits = [...houseVisits, visitData]
      setHouseVisits(updatedVisits)
    }
    
    console.log('✅ Nytt husbesök registrerat:', visitData.visitType)
  }

  const handleDeleteHouseVisit = (visitId: string) => {
    if (propOnDeleteHouseVisit) {
      propOnDeleteHouseVisit(visitId)
    } else {
      const updatedVisits = houseVisits.filter(visit => visit.id !== visitId)
      setHouseVisits(updatedVisits)
    }
    
    console.log('🗑️ Husbesök borttaget:', visitId)
  }

  const handleToggleObjectVisibility = (id: string) => {
    if (propOnToggleObjectVisibility) {
      propOnToggleObjectVisibility(id)
    }
  }

  const handleDeleteObject = (id: string) => {
    if (propOnDeleteObject) {
      propOnDeleteObject(id)
    }
  }

  const handleEditObject = (id: string) => {
    if (propOnEditObject) {
      propOnEditObject(id)
    }
  }

  const handleObjectTeamAssignment = (objectId: string, team: string) => {
    if (propOnObjectTeamAssignment) {
      propOnObjectTeamAssignment(objectId, team)
    }
  }

  const handleObjectColorChange = (objectId: string, color: string) => {
    if (propOnObjectColorChange) {
      propOnObjectColorChange(objectId, color)
    }
  }

  const handleObjectClick = (object: DrawnObject) => {
    if (!isDrawing && !houseVisitMode) {
      setSelectedObject({
        id: object.id,
        name: object.name,
        type: object.type
      })
    }
  }

  const getMunicipalityStyle = (municipality: MunicipalityData) => {
    const isSelected = selectedMunicipality === municipality.code
    return {
      fillColor: isSelected ? '#003366' : '#f3f4f6',
      weight: isSelected ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#FFD700' : '#9ca3af',
      fillOpacity: isSelected ? 0.3 : 0.1 // Minskat för bättre kartsynlighet
    }
  }

  const getDistrictStyle = (district: DistrictData) => {
    const isHighlighted = highlightedDistrict === district.name
    let fillColor = '#e5e7eb'
    
    if (district.teamAssignment) {
      fillColor = teamColors[district.teamAssignment] || teamColors['Ej tilldelad']
    }
    
    // Använd KD gold för markerat distrikt
    if (isHighlighted) {
      fillColor = '#FFD700' // KD gold
    }
    
    return {
      fillColor,
      weight: isHighlighted ? 3 : 1,
      opacity: 1,
      color: isHighlighted ? '#003366' : '#6b7280', // KD blue border för markerat distrikt
      fillOpacity: isHighlighted ? 0.4 : 0.15 // Minskat för bättre kartsynlighet
    }
  }

  const getDrawnObjectStyle = (obj: DrawnObject) => {
    // Använd objektets egen färg eller KD blue för objekt utan team-tilldelning
    const baseColor = obj.teamAssignment ? obj.color : '#003366' // KD blue
    
    return {
      color: baseColor,
      weight: 4, // Tjockare linjer för bättre synlighet
      opacity: obj.visible ? 1.0 : 0.4, // Mer opak för bättre synlighet
      fillOpacity: obj.visible ? 0.4 : 0.1,
      // Lägg till en vit kant för bättre kontrast
      dashArray: obj.teamAssignment ? undefined : '10,5', // Streckad linje för ej tilldelade
    }
  }

  const getSelectedDistrictInfo = () => {
    if (!selectedDistrict) return null
    return districts.find(d => d.name === selectedDistrict)
  }

  const selectedDistrictInfo = propSelectedDistrictInfo || getSelectedDistrictInfo()

  // Laddningsskärm
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#003366] mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-[#003366] mb-2">Laddar kartdata</h2>
          <p className="text-gray-600 mb-2">Hämtar kommuner och valdistrikt från GitHub...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">Försök {retryCount + 1} av 4</p>
          )}
        </div>
      </div>
    )
  }

  // Felskärm
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-[#003366] mb-2">Fel vid laddning av karta</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setRetryCount(0)
                loadInitialData()
              }}
              className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw size={16} />
              <span>Försök igen</span>
            </button>
            <p className="text-xs text-gray-500">
              Kontrollera internetanslutning och försök igen
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Kontrollera att vi har kartdata innan rendering
  if (!mapReady || municipalities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-yellow-600 mb-4">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-[#003366] mb-2">Ingen kartdata tillgänglig</h2>
          <p className="text-gray-600 mb-4">Kunde inte ladda kommundata från GitHub</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative flex flex-col">
      {/* Compact Fixed Header Navigation - KD-styled */}
      <div className="bg-white border-b border-[#E5E7EB] shadow-sm z-[1100] relative">
        <div className="px-3 py-2">
          <div className="flex items-center justify-center space-x-2">
            {/* Drawing Mode Toggle */}
            <button
              onClick={() => setIsDrawing(!isDrawing)}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 border font-medium text-sm shadow-sm hover:shadow-md ${
                isDrawing
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700' 
                  : 'bg-white text-[#003366] border-[#003366] hover:bg-[#F3F4F6] hover:border-[#004080]'
              }`}
            >
              {isDrawing ? <X size={14} /> : <Edit size={14} />}
              <span>{isDrawing ? 'Avsluta' : 'Rita'}</span>
            </button>

            {/* House Visit Mode Toggle */}
            <button
              onClick={() => setHouseVisitMode(!houseVisitMode)}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 border font-medium text-sm shadow-sm hover:shadow-md ${
                houseVisitMode
                  ? 'bg-[#003366] text-white border-[#003366] hover:bg-[#004080] hover:border-[#004080]' 
                  : 'bg-white text-[#003366] border-[#003366] hover:bg-[#F3F4F6] hover:border-[#004080]'
              }`}
            >
              <Home size={14} />
              <span>Husbesök</span>
            </button>

            {/* Map Style Selector */}
            <div className="relative">
              <button
                onClick={() => setShowMapStyleDropdown(!showMapStyleDropdown)}
                className="px-3 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 border font-medium text-sm shadow-sm hover:shadow-md bg-white text-[#003366] border-[#003366] hover:bg-[#F3F4F6] hover:border-[#004080]"
              >
                <MapIcon size={14} />
                <span>Kartstil</span>
                {showMapStyleDropdown ? <X size={12} /> : <MapIcon size={12} />}
              </button>
              
              {showMapStyleDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-[1200] min-w-[150px]">
                  {mapStyles.map((style, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentMapStyle(index)
                        setShowMapStyleDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-[#F3F4F6] border-b border-gray-100 last:border-b-0 transition-colors text-sm ${
                        currentMapStyle === index ? 'bg-[#003366] text-white' : 'text-[#003366]'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Panel Toggle Buttons */}
            {drawnObjects.length > 0 && (
              <button
                onClick={() => setShowObjectsPanel(!showObjectsPanel)}
                className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 border font-medium text-sm shadow-sm hover:shadow-md ${
                  showObjectsPanel
                    ? 'bg-[#003366] text-white border-[#003366] hover:bg-[#004080] hover:border-[#004080]'
                    : 'bg-white text-[#003366] border-[#003366] hover:bg-[#F3F4F6] hover:border-[#004080]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Objekt ({drawnObjects.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map Container - Maximized viewport */}
      <div className="flex-1 relative">
        <MapContainer
          bounds={skaneBounds}
          center={skaneCenter}
          zoom={8}
          className="h-full w-full"
          zoomControl={true}
          attributionControl={true}
          whenReady={(map) => {
            setMapInstance(map.target)
            console.log('🗺️ Karta är redo')
          }}
        >
          <TileLayer
            attribution={mapStyles[currentMapStyle].attribution}
            url={mapStyles[currentMapStyle].url}
            maxZoom={19}
            minZoom={6}
            errorTileUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IiNmN2Y3ZjciLz4KPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTRweCIgZmlsbD0iIzk5OSI+RmVsIGkga2FydHRpbGU8L3RleHQ+PC9zdmc+"
          />

          {/* Render municipalities - lägst z-index */}
          {municipalities.map((municipality, index) => (
            municipality.geojson && municipality.geojson.geometry ? (
              <GeoJSON
                key={`municipality-${municipality.code}-${index}`}
                data={municipality.geojson}
                style={() => getMunicipalityStyle(municipality)}
                eventHandlers={{
                  click: () => handleMunicipalityClick(municipality.code)
                }}
              />
            ) : null
          ))}

          {/* Render districts - mellan z-index */}
          {districts.map((district, index) => (
            district.geojson && district.geojson.geometry ? (
              <GeoJSON
                key={`district-${district.name}-${index}`}
                data={district.geojson}
                style={() => getDistrictStyle(district)}
                eventHandlers={{
                  click: () => handleDistrictClick(district.name)
                }}
              />
            ) : null
          ))}

          {/* Render drawn objects - högst z-index för att ligga ovanpå */}
          {drawnObjects.filter(obj => obj.visible && obj.geoJson && obj.geoJson.geometry).map((obj, index) => (
            <GeoJSONWithEvents
              key={`drawn-${obj.id}-${index}`}
              data={obj.geoJson}
              style={() => getDrawnObjectStyle(obj)}
              onClick={() => handleObjectClick(obj)}
              areaId={obj.id}
              areaName={obj.name}
              areaType={obj.type}
            />
          ))}

          {/* Render house visit markers - högst z-index */}
          <HouseVisitMarkers
            visits={houseVisits}
            onDeleteVisit={handleDeleteHouseVisit}
          />

          <DrawingControls
            onAreaCreated={handleAreaCreated}
            onHouseVisitCreated={handleHouseVisitCreated}
            isDrawing={isDrawing}
            onDrawingToggle={() => setIsDrawing(!isDrawing)}
            houseVisitMode={houseVisitMode}
            onHouseVisitModeToggle={() => setHouseVisitMode(!houseVisitMode)}
          />
        </MapContainer>

        {/* Collapsible Panels - KD-styled */}
        {/* Drawn Objects Panel */}
        {showObjectsPanel && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-xl w-80 max-h-[75vh] overflow-hidden z-[1000] border border-[#E5E7EB]">
            <div className="bg-[#003366] text-white p-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Ritade objekt ({drawnObjects.length})
              </h2>
              <button
                onClick={() => setShowObjectsPanel(false)}
                className="p-1 hover:bg-[#004080] rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[calc(75vh-60px)] overflow-y-auto">
              <DrawnObjectsPanel
                objects={drawnObjects}
                onToggleVisibility={handleToggleObjectVisibility}
                onDeleteObject={handleDeleteObject}
                onEditObject={handleEditObject}
                onClose={() => setShowObjectsPanel(false)}
                onTeamAssignment={handleObjectTeamAssignment}
                onColorChange={handleObjectColorChange}
              />
            </div>
          </div>
        )}

        {/* Compact Mode Indicators - KD-styled */}
        {houseVisitMode && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#003366] text-white px-4 py-2 rounded-lg shadow-lg z-[1000] flex items-center space-x-2">
            <Home size={14} />
            <span className="text-sm">Husbesöksläge aktivt</span>
          </div>
        )}

        {isDrawing && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-[1000] flex items-center space-x-2">
            <Edit size={14} />
            <span className="text-sm">Ritläge aktivt</span>
          </div>
        )}

        {/* Area Info Popup */}
        {selectedObject && (
          <AreaInfoPopup
            areaId={selectedObject.id}
            areaName={selectedObject.name}
            areaType={selectedObject.type}
            onClose={() => setSelectedObject(null)}
          />
        )}
      </div>
    </div>
  )
}