import React, { useState, useEffect } from 'react'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { MapView } from './components/Map/MapView'
import { StatisticsView } from './components/Statistics/StatisticsView'
import { TeamsView } from './components/Teams/TeamsView'
import { SettingsView } from './components/Settings/SettingsView'
import { VisitDatabaseView } from './components/Database/VisitDatabaseView'
import { KampanjomradenView } from './components/Campaign/KampanjomradenView'
import { CampaignManagement } from './components/Campaign/CampaignManagement'
import { HouseVisitData } from './components/Map/HouseVisitForm'
import { geoDataService, DistrictData, MunicipalityData } from './lib/geoDataService'
import { visitService, areaService, syncService, Area, Visit } from './lib/supabase'
import { teamService } from './lib/teamService'

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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('map')
  const [error, setError] = useState<string | null>(null)
  
  // Map state for sidebar integration
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([])
  const [districts, setDistricts] = useState<DistrictData[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  
  // House visits state - now with GLOBAL real-time sync
  const [houseVisits, setHouseVisits] = useState<HouseVisitData[]>([])
  const [loadingVisits, setLoadingVisits] = useState(false)

  // Drawn objects state - now with GLOBAL real-time sync
  const [drawnObjects, setDrawnObjects] = useState<DrawnObject[]>([])
  const [loadingAreas, setLoadingAreas] = useState(false)

  // Map instance for address search
  const [mapInstance, setMapInstance] = useState<any>(null)

  // Load municipalities, house visits, and drawn objects on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([
          loadMunicipalities(),
          loadHouseVisits(),
          loadDrawnObjects()
        ])
        
        // Initialize GLOBAL real-time sync after data is loaded
        const cleanup = initializeGlobalRealTimeSync()
        
        // Return cleanup function
        return cleanup
      } catch (error) {
        console.error('Error initializing app:', error)
        setError('Failed to initialize application. Please refresh the page.')
      }
    }

    const cleanupPromise = initializeApp()
    
    // Cleanup on unmount
    return () => {
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup()
      }).catch(console.error)
    }
  }, [])

  const initializeGlobalRealTimeSync = () => {
    try {
      console.log('🌍 Setting up GLOBAL real-time synchronization for ALL users...')
      
      // Initialize Supabase real-time subscriptions with global broadcasting
      const cleanup = syncService.initialize()

      // Listen for visit changes with GLOBAL handling
      const handleVisitChange = (event: CustomEvent) => {
        try {
          const { eventType, new: newRecord, old: oldRecord } = event.detail
          
          console.log('🌍 Processing GLOBAL visit change:', eventType, newRecord?.id || oldRecord?.id)
          
          switch (eventType) {
            case 'INSERT':
              if (newRecord) {
                const newVisit = convertSupabaseToHouseVisit(newRecord)
                setHouseVisits(prev => {
                  const exists = prev.find(v => v.id === newVisit.id)
                  if (exists) {
                    console.log('🔄 Visit already exists, skipping duplicate')
                    return prev
                  }
                  console.log('✅ Adding new visit to UI (GLOBAL):', newVisit.id)
                  return [newVisit, ...prev]
                })
              }
              break
            case 'UPDATE':
              if (newRecord) {
                const updatedVisit = convertSupabaseToHouseVisit(newRecord)
                setHouseVisits(prev => {
                  const updated = prev.map(v => v.id === updatedVisit.id ? updatedVisit : v)
                  console.log('✅ Visit updated in UI (GLOBAL):', updatedVisit.id)
                  return updated
                })
              }
              break
            case 'DELETE':
              if (oldRecord) {
                setHouseVisits(prev => {
                  const filtered = prev.filter(v => v.id !== oldRecord.id)
                  console.log('✅ Visit removed from UI (GLOBAL):', oldRecord.id)
                  return filtered
                })
              }
              break
          }
        } catch (error) {
          console.error('Error handling GLOBAL visit change:', error)
        }
      }

      // Listen for area changes with GLOBAL handling
      const handleAreaChange = (event: CustomEvent) => {
        try {
          const { eventType, new: newRecord, old: oldRecord } = event.detail
          
          console.log('🌍 Processing GLOBAL area change:', eventType, newRecord?.id || oldRecord?.id)
          
          switch (eventType) {
            case 'INSERT':
              if (newRecord) {
                const newArea = convertSupabaseToDrawnObject(newRecord)
                setDrawnObjects(prev => {
                  const exists = prev.find(a => a.id === newArea.id)
                  if (exists) {
                    console.log('🔄 Area already exists, skipping duplicate')
                    return prev
                  }
                  console.log('✅ Adding new area to UI (GLOBAL):', newArea.id)
                  return [newArea, ...prev]
                })
              }
              break
            case 'UPDATE':
              if (newRecord) {
                const updatedArea = convertSupabaseToDrawnObject(newRecord)
                setDrawnObjects(prev => {
                  const updated = prev.map(a => a.id === updatedArea.id ? updatedArea : a)
                  console.log('✅ Area updated in UI (GLOBAL):', updatedArea.id)
                  return updated
                })
              }
              break
            case 'DELETE':
              if (oldRecord) {
                setDrawnObjects(prev => {
                  const filtered = prev.filter(a => a.id !== oldRecord.id)
                  console.log('✅ Area removed from UI (GLOBAL):', oldRecord.id)
                  return filtered
                })
              }
              break
          }
        } catch (error) {
          console.error('Error handling GLOBAL area change:', error)
        }
      }

      // Listen for team changes with GLOBAL handling
      const handleTeamChange = (event: CustomEvent) => {
        try {
          const { eventType, new: newRecord, old: oldRecord } = event.detail
          
          console.log('🌍 Processing GLOBAL team change:', eventType, newRecord?.id || oldRecord?.id)
          
          // Refresh areas to get updated team assignments
          loadDrawnObjects()
        } catch (error) {
          console.error('Error handling GLOBAL team change:', error)
        }
      }

      // Listen for manual sync events (GLOBAL)
      const handleManualSync = (event: CustomEvent) => {
        try {
          const { visits, areas } = event.detail
          console.log('🌍 Processing GLOBAL manual sync:', visits.length, 'visits,', areas.length, 'areas')
          
          if (visits) {
            const convertedVisits = visits.map(convertSupabaseToHouseVisit)
            setHouseVisits(convertedVisits)
          }
          
          if (areas) {
            const convertedAreas = areas.map(convertSupabaseToDrawnObject)
            setDrawnObjects(convertedAreas)
          }
          
          console.log('✅ GLOBAL manual sync completed')
        } catch (error) {
          console.error('Error handling GLOBAL manual sync:', error)
        }
      }

      // Listen for periodic sync events (GLOBAL)
      const handlePeriodicSync = (event: CustomEvent) => {
        try {
          const { visits, areas } = event.detail
          console.log('🌍 Processing GLOBAL periodic sync:', visits.length, 'visits,', areas.length, 'areas')
          
          // Update data silently to keep all users in sync
          if (visits) {
            const convertedVisits = visits.map(convertSupabaseToHouseVisit)
            setHouseVisits(prev => {
              // Only update if there are actual changes
              if (JSON.stringify(prev.map(v => v.id).sort()) !== JSON.stringify(convertedVisits.map(v => v.id).sort())) {
                console.log('🔄 Updating visits from periodic sync')
                return convertedVisits
              }
              return prev
            })
          }
          
          if (areas) {
            const convertedAreas = areas.map(convertSupabaseToDrawnObject)
            setDrawnObjects(prev => {
              // Only update if there are actual changes
              if (JSON.stringify(prev.map(a => a.id).sort()) !== JSON.stringify(convertedAreas.map(a => a.id).sort())) {
                console.log('🔄 Updating areas from periodic sync')
                return convertedAreas
              }
              return prev
            })
          }
          
          console.log('✅ GLOBAL periodic sync completed')
        } catch (error) {
          console.error('Error handling GLOBAL periodic sync:', error)
        }
      }

      // Add GLOBAL event listeners
      window.addEventListener('visitChange', handleVisitChange as EventListener)
      window.addEventListener('areaChange', handleAreaChange as EventListener)
      window.addEventListener('teamChange', handleTeamChange as EventListener)
      window.addEventListener('manualSync', handleManualSync as EventListener)
      window.addEventListener('periodicSync', handlePeriodicSync as EventListener)

      // Enhanced cleanup function
      return () => {
        try {
          cleanup()
          window.removeEventListener('visitChange', handleVisitChange as EventListener)
          window.removeEventListener('areaChange', handleAreaChange as EventListener)
          window.removeEventListener('teamChange', handleTeamChange as EventListener)
          window.removeEventListener('manualSync', handleManualSync as EventListener)
          window.removeEventListener('periodicSync', handlePeriodicSync as EventListener)
          console.log('✅ GLOBAL real-time sync cleanup completed')
        } catch (error) {
          console.error('Error during GLOBAL cleanup:', error)
        }
      }
    } catch (error) {
      console.error('Error initializing GLOBAL real-time sync:', error)
      return () => {}
    }
  }

  const convertSupabaseToHouseVisit = (supabaseVisit: Visit): HouseVisitData => {
    // First try to get the original visit type from campaign_materials
    let visitType: HouseVisitData['visitType'] = 'hus'
    
    if (supabaseVisit.campaign_materials?.frontendVisitType) {
      // Use the stored frontend visit type for exact preservation
      visitType = supabaseVisit.campaign_materials.frontendVisitType
    } else {
      // Fallback to deriving from visit_type and other fields for backward compatibility
      if (supabaseVisit.visit_type === 'household_contact') {
        // For household_contact, we need to determine the specific type based on door_knock_result or notes
        if (supabaseVisit.door_knock_result) {
          visitType = 'knackat_dörr'
        } else if (supabaseVisit.notes?.toLowerCase().includes('medlem')) {
          visitType = 'blev_medlem'
        } else if (supabaseVisit.notes?.toLowerCase().includes('partist')) {
          visitType = 'partist'
        } else if (supabaseVisit.notes?.toLowerCase().includes('pratat')) {
          visitType = 'pratat_med_boende'
        } else {
          visitType = 'knackat_dörr' // Default for household_contact
        }
      } else {
        visitType = 'hus' // area_visit maps to 'hus'
      }
    }

    return {
      id: supabaseVisit.id,
      position: { lat: supabaseVisit.latitude, lng: supabaseVisit.longitude },
      visitType,
      notes: supabaseVisit.notes || '',
      timestamp: supabaseVisit.created_at,
      doorKnockResult: supabaseVisit.door_knock_result,
      address: supabaseVisit.address,
      fullAddress: supabaseVisit.full_address
    }
  }

  const convertSupabaseToDrawnObject = (supabaseArea: Area): DrawnObject => {
    const metadata = supabaseArea.geojson?.properties || {}
    
    return {
      id: supabaseArea.id,
      name: supabaseArea.name,
      type: metadata.type || 'kampanjområde',
      description: metadata.description || '',
      geoJson: supabaseArea.geojson,
      visible: metadata.visible !== false,
      color: metadata.color || getObjectColor(metadata.type || 'kampanjområde'),
      teamAssignment: supabaseArea.assigned_to,
      created_at: supabaseArea.created_at,
      updated_at: supabaseArea.updated_at
    }
  }

  const loadMunicipalities = async () => {
    try {
      const municipalitiesData = await geoDataService.loadMunicipalities()
      setMunicipalities(municipalitiesData)
      console.log(`✅ ${municipalitiesData.length} kommuner laddade i App`)
    } catch (error) {
      console.error('❌ Fel vid laddning av kommuner i App:', error)
    }
  }

  const loadDrawnObjects = async () => {
    try {
      setLoadingAreas(true)
      console.log('🔄 Loading drawn objects from Supabase...')
      
      const supabaseAreas = await areaService.getAll()
      
      if (supabaseAreas.length > 0) {
        const convertedObjects: DrawnObject[] = supabaseAreas.map(convertSupabaseToDrawnObject)
        setDrawnObjects(convertedObjects)
        console.log(`✅ ${convertedObjects.length} områden laddade från Supabase`)
      } else {
        console.log('ℹ️ No areas found in Supabase')
      }
    } catch (error) {
      console.error('❌ Fel vid laddning av områden:', error)
    } finally {
      setLoadingAreas(false)
    }
  }

  const loadHouseVisits = async () => {
    try {
      setLoadingVisits(true)
      console.log('🔄 Loading house visits from Supabase...')
      
      const supabaseVisits = await visitService.getAll()
      console.log('Raw Supabase visits:', supabaseVisits.length, 'visits loaded')
      
      if (supabaseVisits.length > 0) {
        const convertedVisits: HouseVisitData[] = supabaseVisits.map(visit => {
          console.log('Converting visit:', visit.id, 'with door_knock_result:', visit.door_knock_result, 'and address:', visit.address)
          return convertSupabaseToHouseVisit(visit)
        })
        setHouseVisits(convertedVisits)
        console.log(`✅ ${convertedVisits.length} husbesök laddade från Supabase`)
      } else {
        console.log('ℹ️ No visits found in Supabase')
      }
    } catch (error) {
      console.error('❌ Fel vid laddning av husbesök:', error)
    } finally {
      setLoadingVisits(false)
    }
  }

  const handleMunicipalityChange = async (municipalityCode: string) => {
    setSelectedMunicipality(municipalityCode)
    setSelectedDistrict('')
    
    if (municipalityCode) {
      try {
        const districtsData = await geoDataService.loadDistricts(municipalityCode)
        const districtsWithResults = await geoDataService.combineDistrictsWithResults(districtsData)
        setDistricts(districtsWithResults)
        console.log(`✅ ${districtsWithResults.length} distrikt laddade för kommun ${municipalityCode}`)
      } catch (error) {
        console.error('Fel vid laddning av valdistrikt:', error)
        setDistricts([])
      }
    } else {
      setDistricts([])
    }
  }

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName)
  }

  const handleTeamAssignment = (districtName: string, team: string) => {
    geoDataService.assignTeamToDistrict(districtName, team)
    
    setDistricts(prev => prev.map(d => 
      d.name === districtName 
        ? { ...d, teamAssignment: team }
        : d
    ))
  }

  const handleHouseVisitCreated = async (visitData: HouseVisitData) => {
    try {
      console.log('🏠 Creating house visit with GLOBAL sync:', {
        visitType: visitData.visitType,
        doorKnockResult: visitData.doorKnockResult,
        address: visitData.address,
        notes: visitData.notes,
        position: visitData.position
      })
      
      // Map visit types correctly to Supabase schema
      let visitTypeForSupabase: 'area_visit' | 'household_contact' = 'area_visit'
      
      switch (visitData.visitType) {
        case 'knackat_dörr':
        case 'pratat_med_boende':
        case 'partist':
        case 'blev_medlem':
          visitTypeForSupabase = 'household_contact'
          break
        case 'hus':
        default:
          visitTypeForSupabase = 'area_visit'
          break
      }
      
      // Save to Supabase - GLOBAL real-time sync will handle UI updates automatically
      const supabaseVisit = await visitService.create({
        latitude: visitData.position.lat,
        longitude: visitData.position.lng,
        visit_type: visitTypeForSupabase,
        notes: visitData.notes,
        door_knock_result: visitData.doorKnockResult,
        address: visitData.address,
        full_address: visitData.fullAddress,
        campaign_materials: visitData.campaignMaterials
      })

      console.log('Supabase create result:', supabaseVisit)

      if (supabaseVisit) {
        console.log('✅ Husbesök sparat till Supabase - GLOBAL sync kommer uppdatera ALLA användare')
        
        // Immediate local update for better UX on the creating device
        const newVisitData: HouseVisitData = {
          ...visitData,
          id: supabaseVisit.id,
          timestamp: supabaseVisit.created_at
        }
        
        setHouseVisits(prev => {
          const exists = prev.find(v => v.id === newVisitData.id)
          if (exists) return prev
          return [newVisitData, ...prev]
        })
      } else {
        console.error('❌ Supabase create returned null')
        throw new Error('Failed to save to Supabase')
      }
    } catch (error) {
      console.error('❌ Fel vid sparande av husbesök:', error)
      throw error // Re-throw to let the UI handle the error
    }
  }

  const handleDeleteHouseVisit = async (visitId: string) => {
    try {
      console.log('🗑️ Deleting house visit with GLOBAL sync:', visitId)
      
      // Optimistic update - remove from UI immediately
      setHouseVisits(prev => prev.filter(visit => visit.id !== visitId))
      
      // Try to delete from Supabase - GLOBAL sync will update ALL users
      const success = await visitService.delete(visitId)
      
      if (success) {
        console.log('✅ Husbesök borttaget från Supabase - GLOBAL sync uppdaterar ALLA användare')
      } else {
        console.log('⚠️ Supabase deletion failed, reverting...')
        await loadHouseVisits()
      }
    } catch (error) {
      console.error('❌ Fel vid borttagning av husbesök:', error)
      await loadHouseVisits()
    }
  }

  // Drawn objects handlers - now with GLOBAL Supabase sync
  const handleToggleObjectVisibility = async (id: string) => {
    try {
      const object = drawnObjects.find(obj => obj.id === id)
      if (!object) return

      console.log('👁️ Toggling object visibility with GLOBAL sync:', id, !object.visible)

      // Optimistic update
      setDrawnObjects(prev => prev.map(obj =>
        obj.id === id ? { ...obj, visible: !obj.visible, updated_at: new Date().toISOString() } : obj
      ))

      const updatedGeoJson = {
        ...object.geoJson,
        properties: {
          ...object.geoJson.properties,
          visible: !object.visible
        }
      }

      // Update in Supabase - GLOBAL sync will update ALL users
      const success = await areaService.update(id, {
        geojson: updatedGeoJson
      })

      if (success) {
        console.log('✅ Objektsynlighet uppdaterad i Supabase - GLOBAL sync uppdaterar ALLA användare')
      } else {
        console.log('⚠️ Supabase update failed, reverting...')
        setDrawnObjects(prev => prev.map(obj =>
          obj.id === id ? { ...obj, visible: object.visible } : obj
        ))
      }
    } catch (error) {
      console.error('❌ Fel vid uppdatering av objektsynlighet:', error)
      
      const object = drawnObjects.find(obj => obj.id === id)
      if (object) {
        setDrawnObjects(prev => prev.map(obj =>
          obj.id === id ? { ...obj, visible: object.visible } : obj
        ))
      }
    }
  }

  const handleDeleteObject = async (id: string) => {
    try {
      console.log('🗑️ Deleting object with GLOBAL sync:', id)
      
      // Optimistic update
      setDrawnObjects(prev => prev.filter(obj => obj.id !== id))
      
      // Delete from Supabase - GLOBAL sync will update ALL users
      const success = await areaService.delete(id)
      
      if (success) {
        console.log('✅ Objekt borttaget från Supabase - GLOBAL sync uppdaterar ALLA användare')
      } else {
        console.log('⚠️ Supabase deletion failed, reverting...')
        await loadDrawnObjects()
      }
    } catch (error) {
      console.error('❌ Fel vid borttagning av objekt:', error)
      await loadDrawnObjects()
    }
  }

  const handleEditObject = (id: string) => {
    console.log('🔧 Redigera objekt:', id)
    // TODO: Implementera redigeringsfunktionalitet
  }

  const handleObjectTeamAssignment = async (objectId: string, team: string) => {
    try {
      console.log('👥 Assigning team to object with GLOBAL sync:', objectId, team)

      // Optimistic update
      setDrawnObjects(prev => prev.map(obj =>
        obj.id === objectId ? { ...obj, teamAssignment: team, updated_at: new Date().toISOString() } : obj
      ))

      // Update in Supabase - GLOBAL sync will update ALL users
      const success = await areaService.update(objectId, {
        assigned_to: team || null
      })

      if (success) {
        console.log('✅ Team-tilldelning uppdaterad i Supabase - GLOBAL sync uppdaterar ALLA användare')
      } else {
        console.log('⚠️ Supabase update failed, reverting...')
        await loadDrawnObjects()
      }
    } catch (error) {
      console.error('❌ Fel vid uppdatering av team-tilldelning:', error)
      await loadDrawnObjects()
    }
  }

  const handleObjectColorChange = async (objectId: string, color: string) => {
    try {
      console.log('🎨 Changing object color with GLOBAL sync:', objectId, color)

      // Optimistic update
      setDrawnObjects(prev => prev.map(obj =>
        obj.id === objectId ? { ...obj, color, updated_at: new Date().toISOString() } : obj
      ))

      const object = drawnObjects.find(obj => obj.id === objectId)
      if (!object) return

      const updatedGeoJson = {
        ...object.geoJson,
        properties: {
          ...object.geoJson.properties,
          color
        }
      }

      // Update in Supabase - GLOBAL sync will update ALL users
      const success = await areaService.update(objectId, {
        geojson: updatedGeoJson
      })

      if (success) {
        console.log('✅ Objektfärg uppdaterad i Supabase - GLOBAL sync uppdaterar ALLA användare')
      } else {
        console.log('⚠️ Supabase update failed, reverting...')
        setDrawnObjects(prev => prev.map(obj =>
          obj.id === objectId ? { ...obj, color: object.color } : obj
        ))
      }
    } catch (error) {
      console.error('❌ Fel vid uppdatering av objektfärg:', error)
      
      const object = drawnObjects.find(obj => obj.id === objectId)
      if (object) {
        setDrawnObjects(prev => prev.map(obj =>
          obj.id === objectId ? { ...obj, color: object.color } : obj
        ))
      }
    }
  }

  const handleAreaCreated = async (geoJson: any, name: string, type: string, description: string, color: string) => {
    if (!geoJson || !name || !type) {
      console.error('❌ Ogiltiga områdesdata')
      return
    }

    try {
      console.log('🗺️ Creating new area with GLOBAL sync:', name, type, 'with color:', color)

      const geoJsonWithMetadata = {
        ...geoJson,
        properties: {
          ...geoJson.properties,
          type,
          description,
          visible: true,
          color
        }
      }

      // Create optimistic local object for immediate UI feedback
      const tempObject: DrawnObject = {
        id: `temp-${Date.now()}`,
        name,
        type,
        description,
        geoJson: geoJsonWithMetadata,
        visible: true,
        color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Add to UI immediately for better UX
      setDrawnObjects(prev => [tempObject, ...prev])

      // Save to Supabase - GLOBAL sync will update ALL users
      const supabaseArea = await areaService.create({
        name,
        municipality: 'Unknown',
        electoral_district: 'Unknown',
        geojson: geoJsonWithMetadata
      })

      if (supabaseArea) {
        console.log('✅ Nytt kampanjobjekt skapat i Supabase - GLOBAL sync uppdaterar ALLA användare:', name, 'med färg:', color)
        
        // Replace temporary object with real Supabase object
        const realObject = convertSupabaseToDrawnObject(supabaseArea)
        setDrawnObjects(prev => prev.map(obj => 
          obj.id === tempObject.id ? realObject : obj
        ))
      } else {
        // Remove temporary object if save failed
        setDrawnObjects(prev => prev.filter(obj => obj.id !== tempObject.id))
        console.error('❌ Failed to save area to Supabase')
      }
    } catch (error) {
      console.error('❌ Fel vid skapande av kampanjobjekt:', error)
      
      // Remove temporary object on error
      setDrawnObjects(prev => prev.filter(obj => !obj.id.startsWith('temp-')))
    }
  }

  const getObjectColor = (type: string): string => {
    const colors: Record<string, string> = {
      kampanjområde: '#003366',
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

  const getSelectedDistrictInfo = () => {
    if (!selectedDistrict) return null
    return districts.find(d => d.name === selectedDistrict)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'map':
        return (
          <MapView
            municipalities={municipalities}
            districts={districts}
            selectedMunicipality={selectedMunicipality}
            selectedDistrict={selectedDistrict}
            onMunicipalityChange={handleMunicipalityChange}
            onDistrictChange={handleDistrictChange}
            onTeamAssignment={handleTeamAssignment}
            selectedDistrictInfo={getSelectedDistrictInfo()}
            houseVisits={houseVisits}
            onHouseVisitCreated={handleHouseVisitCreated}
            onDeleteHouseVisit={handleDeleteHouseVisit}
            drawnObjects={drawnObjects}
            onAreaCreated={handleAreaCreated}
            onToggleObjectVisibility={handleToggleObjectVisibility}
            onDeleteObject={handleDeleteObject}
            onEditObject={handleEditObject}
            onObjectTeamAssignment={handleObjectTeamAssignment}
            onObjectColorChange={handleObjectColorChange}
          />
        )
      case 'database':
        return (
          <VisitDatabaseView
            visits={houseVisits}
            onDeleteVisit={handleDeleteHouseVisit}
            loading={loadingVisits}
          />
        )
      case 'kampanjomraden':
        return (
          <KampanjomradenView
            objects={drawnObjects}
            onToggleVisibility={handleToggleObjectVisibility}
            onDeleteObject={handleDeleteObject}
            onEditObject={handleEditObject}
            onTeamAssignment={handleObjectTeamAssignment}
          />
        )
      case 'statistics':
        return <StatisticsView />
      case 'teams':
        return <TeamsView />
      case 'campaign':
        return <CampaignManagement />
      case 'settings':
        return <SettingsView />
      default:
        return (
          <MapView
            municipalities={municipalities}
            districts={districts}
            selectedMunicipality={selectedMunicipality}
            selectedDistrict={selectedDistrict}
            onMunicipalityChange={handleMunicipalityChange}
            onDistrictChange={handleDistrictChange}
            onTeamAssignment={handleTeamAssignment}
            selectedDistrictInfo={getSelectedDistrictInfo()}
            houseVisits={houseVisits}
            onHouseVisitCreated={handleHouseVisitCreated}
            onDeleteHouseVisit={handleDeleteHouseVisit}
            drawnObjects={drawnObjects}
            onAreaCreated={handleAreaCreated}
            onToggleObjectVisibility={handleToggleObjectVisibility}
            onDeleteObject={handleDeleteObject}
            onEditObject={handleEditObject}
            onObjectTeamAssignment={handleObjectTeamAssignment}
            onObjectColorChange={handleObjectColorChange}
          />
        )
    }
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'map':
        return 'Kampanjkompanjonen'
      case 'database':
        return 'Husbesöksdatabas'
      case 'kampanjomraden':
        return 'Kampanjområden'
      case 'statistics':
        return 'Statistik'
      case 'teams':
        return 'Teams'
      case 'campaign':
        return 'Kampanjhantering'
      case 'settings':
        return 'Inställningar'
      default:
        return 'Kampanjkompanjonen'
    }
  }

  // Show error state if there's a critical error
  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#003366] text-white rounded hover:bg-[#004080]"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        title={getViewTitle()}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onViewChange={setCurrentView}
          municipalities={municipalities}
          districts={districts}
          selectedMunicipality={selectedMunicipality}
          selectedDistrict={selectedDistrict}
          onMunicipalityChange={handleMunicipalityChange}
          onDistrictChange={handleDistrictChange}
          onTeamAssignment={handleTeamAssignment}
          selectedDistrictInfo={getSelectedDistrictInfo()}
          houseVisitsCount={houseVisits.length}
          mapInstance={mapInstance}
        />
        
        <main className="flex-1">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  )
}

export default App