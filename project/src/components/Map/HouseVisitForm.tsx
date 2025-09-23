import React, { useState, useEffect } from 'react'
import { X, Save, Home, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, MapPin, Loader, UserPlus } from 'lucide-react'

interface HouseVisitFormProps {
  onSave: (visitData: HouseVisitData) => void
  onCancel: () => void
  position: { lat: number, lng: number }
}

export interface HouseVisitData {
  id: string
  position: { lat: number, lng: number }
  visitType: 'hus' | 'knackat_dörr' | 'pratat_med_boende' | 'partist' | 'blev_medlem'
  doorKnockResult?: 'boende_öppnade_inte' | 'ville_inte_prata' | 'positiv' | 'negativ'
  notes: string
  timestamp: string
  address?: string
  fullAddress?: {
    street?: string
    houseNumber?: string
    city?: string
    postalCode?: string
    county?: string
  }
  campaignMaterials?: any
}

// Reverse geocoding service using Supabase Edge Function (CORS-free)
const reverseGeocode = async (lat: number, lng: number): Promise<{
  address?: string
  fullAddress?: HouseVisitData['fullAddress']
}> => {
  try {
    // Use Supabase Edge Function instead of direct Nominatim call
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }
    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/reverse-geocode?lat=${lat}&lng=${lng}`
    
    const response = await fetch(edgeFunctionUrl, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    return {
      address: data.address,
      fullAddress: data.full_address ? {
        street: data.full_address.street,
        houseNumber: data.full_address.house_number,
        city: data.full_address.city,
        postalCode: data.full_address.postal_code,
        county: data.full_address.county
      } : undefined
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return {}
  }
}

export function HouseVisitForm({ onSave, onCancel, position }: HouseVisitFormProps) {
  const [visitType, setVisitType] = useState<HouseVisitData['visitType']>('hus')
  const [doorKnockResult, setDoorKnockResult] = useState<HouseVisitData['doorKnockResult']>()
  const [notes, setNotes] = useState('')
  const [address, setAddress] = useState('')
  const [fullAddress, setFullAddress] = useState<HouseVisitData['fullAddress']>()
  const [isLoadingAddress, setIsLoadingAddress] = useState(true)
  const [addressError, setAddressError] = useState(false)

  // Load address automatically when component mounts
  useEffect(() => {
    const loadAddress = async () => {
      setIsLoadingAddress(true)
      setAddressError(false)
      
      try {
        const result = await reverseGeocode(position.lat, position.lng)
        if (result.address) {
          setAddress(result.address)
          setFullAddress(result.fullAddress)
        } else {
          setAddressError(true)
        }
      } catch (error) {
        console.error('Failed to load address:', error)
        setAddressError(true)
      } finally {
        setIsLoadingAddress(false)
      }
    }

    loadAddress()
  }, [position])

  const handleSave = () => {
    // Generate a unique ID for the visit
    const visitId = `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const visitData: HouseVisitData = {
      id: visitId,
      position,
      visitType,
      doorKnockResult: visitType === 'knackat_dörr' ? doorKnockResult : undefined,
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
      address: address.trim() || undefined,
      fullAddress,
      campaignMaterials: { frontendVisitType: visitType }
    }

    console.log('🏠 Saving house visit with data:', {
      id: visitData.id,
      visitType: visitData.visitType,
      doorKnockResult: visitData.doorKnockResult,
      address: visitData.address,
      notes: visitData.notes,
      position: visitData.position
    })

    onSave(visitData)
  }

  const isValid = () => {
    // All visit types are valid, but door knocking requires a result
    if (visitType === 'knackat_dörr' && !doorKnockResult) {
      return false
    }
    return true
  }

  const getVisitTypeIcon = (type: HouseVisitData['visitType']) => {
    switch (type) {
      case 'hus':
        return <Home className="w-3 h-3" />
      case 'knackat_dörr':
        return <AlertCircle className="w-3 h-3" />
      case 'pratat_med_boende':
        return <MessageSquare className="w-3 h-3" />
      case 'partist':
        return <ThumbsUp className="w-3 h-3" />
      case 'blev_medlem':
        return <UserPlus className="w-3 h-3" />
      default:
        return <Home className="w-3 h-3" />
    }
  }

  const getResultIcon = (result: HouseVisitData['doorKnockResult']) => {
    switch (result) {
      case 'positiv':
        return <ThumbsUp className="w-3 h-3 text-green-600" />
      case 'negativ':
        return <ThumbsDown className="w-3 h-3 text-red-600" />
      case 'ville_inte_prata':
        return <X className="w-3 h-3 text-yellow-600" />
      case 'boende_öppnade_inte':
        return <AlertCircle className="w-3 h-3 text-gray-600" />
      default:
        return null
    }
  }

  const getVisitTypeDescription = (type: HouseVisitData['visitType']) => {
    switch (type) {
      case 'hus':
        return 'Markera intressant hus för framtida besök'
      case 'knackat_dörr':
        return 'Besökt och knackat på dörren'
      case 'pratat_med_boende':
        return 'Haft längre samtal med boende'
      case 'partist':
        return 'Identifierad sympatisör eller partist'
      case 'blev_medlem':
        return 'Person som blev medlem i partiet'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-2">
      <div className="bg-white rounded-lg w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto">
        {/* Header - Fixed */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Registrera husbesök
            </h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-3 space-y-3">
          {/* Address Section */}
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <div className="flex items-center mb-1">
              <MapPin className="w-3 h-3 mr-1 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">Adress</span>
            </div>
            
            {isLoadingAddress ? (
              <div className="flex items-center space-x-1 text-blue-700">
                <Loader className="w-3 h-3 animate-spin" />
                <span className="text-xs">Hämtar adress...</span>
              </div>
            ) : addressError ? (
              <div className="text-xs text-red-600">
                Kunde inte hämta adress automatiskt
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-900">{address}</p>
                {fullAddress && (
                  <div className="text-xs text-blue-700 space-y-0.5">
                    {fullAddress.street && fullAddress.houseNumber && (
                      <p>Gata: {fullAddress.street} {fullAddress.houseNumber}</p>
                    )}
                    {fullAddress.city && <p>Ort: {fullAddress.city}</p>}
                    {fullAddress.postalCode && <p>Postnummer: {fullAddress.postalCode}</p>}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-1 text-xs text-blue-600">
              <p>Koordinater: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
            </div>
          </div>

          {/* Manual Address Override */}
          <div>
            <label htmlFor="address-override" className="block text-xs font-medium text-gray-700 mb-1">
              Redigera adress (valfritt)
            </label>
            <input
              id="address-override"
              name="addressOverride"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Redigera adressen om den är felaktig"
              maxLength={200}
            />
          </div>

          {/* Visit Type - Återställd layout */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Typ av besök *
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: 'hus', label: 'Hus identifierat' },
                { value: 'knackat_dörr', label: 'Knackat dörr' },
                { value: 'pratat_med_boende', label: 'Pratat med boende' },
                { value: 'partist', label: 'Partist' },
                { value: 'blev_medlem', label: 'Blev medlem' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVisitType(option.value as HouseVisitData['visitType'])}
                  className={`p-2 border-2 rounded text-left transition-colors ${
                    visitType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  } ${option.value === 'blev_medlem' ? 'col-span-2' : ''}`}
                >
                  <div className="flex items-center space-x-1 mb-1">
                    {getVisitTypeIcon(option.value as HouseVisitData['visitType'])}
                    <span className="text-xs font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {getVisitTypeDescription(option.value as HouseVisitData['visitType'])}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Door Knock Result - Only show if "knackat_dörr" is selected */}
          {visitType === 'knackat_dörr' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Resultat av dörrknackning *
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { 
                    value: 'boende_öppnade_inte', 
                    label: 'Öppnade inte', 
                    description: 'Ingen svarade',
                    color: 'gray' 
                  },
                  { 
                    value: 'ville_inte_prata', 
                    label: 'Ville inte prata', 
                    description: 'Avböjde samtal',
                    color: 'yellow' 
                  },
                  { 
                    value: 'positiv', 
                    label: 'Positiv', 
                    description: 'Bra mottagande',
                    color: 'green' 
                  },
                  { 
                    value: 'negativ', 
                    label: 'Negativ', 
                    description: 'Negativ reaktion',
                    color: 'red' 
                  }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDoorKnockResult(option.value as HouseVisitData['doorKnockResult'])}
                    className={`p-2 border-2 rounded text-left transition-colors ${
                      doorKnockResult === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50`
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      {getResultIcon(option.value as HouseVisitData['doorKnockResult'])}
                      <span className="text-xs font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-medium text-gray-700 mb-1">
              Anteckningar
            </label>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Skriv eventuella anteckningar här..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/500 tecken
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 rounded-b-lg">
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid() || isLoadingAddress}
              className="flex-1 px-3 py-2 bg-blue-600 text-white border-2 border-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 text-sm font-medium"
            >
              <Save size={14} />
              <span>Spara besök</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}