import React, { useState, useRef, useEffect } from 'react'
import { Search, MapPin, X } from 'lucide-react'
import L from 'leaflet'

interface AddressSearchProps {
  map: L.Map | null
}

export function AddressSearch({ map }: AddressSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [currentMarker, setCurrentMarker] = useState<L.Marker | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup på unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (currentMarker && map && map.hasLayer(currentMarker)) {
        map.removeLayer(currentMarker)
      }
    }
  }, [currentMarker, map])

  const isInSkane = (result: any): boolean => {
    // Kontrollera om adressen är i Skåne län
    const address = result.address || {}
    const county = address.county || address.state || ''
    const municipality = address.municipality || address.city || address.town || ''
    
    // Lista över Skåne kommuner för extra validering
    const skaneMunicipalities = [
      'Malmö', 'Lund', 'Helsingborg', 'Kristianstad', 'Landskrona', 'Trelleborg',
      'Ystad', 'Eslöv', 'Ängelholm', 'Hässleholm', 'Simrishamn', 'Höganäs',
      'Staffanstorp', 'Burlöv', 'Vellinge', 'Östra Göinge', 'Örkelljunga',
      'Bjuv', 'Kävlinge', 'Lomma', 'Svedala', 'Skurup', 'Sjöbo', 'Hörby',
      'Höör', 'Tomelilla', 'Bromölla', 'Osby', 'Perstorp', 'Klippan',
      'Åstorp', 'Båstad', 'Svalöv'
    ]
    
    // Kontrollera län
    if (county.toLowerCase().includes('skåne') || county.toLowerCase().includes('scania')) {
      return true
    }
    
    // Kontrollera kommun
    const municipalityMatch = skaneMunicipalities.some(skaneCity => 
      municipality.toLowerCase().includes(skaneCity.toLowerCase())
    )
    
    // Kontrollera koordinater (Skåne är ungefär mellan dessa koordinater)
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    const isInSkaneCoordinates = lat >= 55.3 && lat <= 56.5 && lon >= 12.5 && lon <= 14.5
    
    return municipalityMatch || isInSkaneCoordinates
  }

  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      console.log('🔍 Söker adresser i Skåne för:', query)
      
      // Sök med fokus på Skåne län
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Skåne')}&countrycodes=se&limit=10&addressdetails=1&bounded=1&viewbox=12.5,56.5,14.5,55.3`,
        {
          headers: {
            'User-Agent': 'Kampanjkompanjonen/1.0'
          }
        }
      )
      
      if (response.ok) {
        const allResults = await response.json()
        
        // Filtrera endast resultat i Skåne
        const skaneResults = allResults.filter(isInSkane)
        
        console.log(`✅ Hittade ${skaneResults.length} adresser i Skåne av ${allResults.length} totalt`)
        
        setSearchResults(skaneResults)
        setShowResults(skaneResults.length > 0)
      }
    } catch (error) {
      console.error('❌ Fel vid adresssökning:', error)
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Rensa tidigare timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Sök med debounce - ingen minimigräns för tecken
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(value)
      }, 300) // 300ms debounce
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }

  const selectResult = (result: any) => {
    if (!map || !result.lat || !result.lon) {
      console.warn('⚠️ Kan inte centrera karta - saknar karta eller koordinater')
      return
    }

    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    
    console.log('🎯 Centrerar kartan på vald adress:', result.display_name)
    console.log('📍 Koordinater:', lat, lng)
    
    try {
      // Ta bort tidigare markör om den finns
      if (currentMarker) {
        if (map.hasLayer(currentMarker)) {
          map.removeLayer(currentMarker)
        }
        setCurrentMarker(null)
      }
      
      // Centrera kartan på den valda adressen med lämplig zoom
      map.setView([lat, lng], 17, {
        animate: true,
        duration: 1.0
      })
      
      console.log('✅ Karta centrerad på:', lat, lng)
      
      // Vänta lite för att kartan ska hinna centrera sig
      setTimeout(() => {
        // Lägg till en markör för den valda adressen
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `
              <div style="
                background-color: #FFD700;
                width: 28px;
                height: 28px;
                border-radius: 50% 50% 50% 0;
                border: 3px solid #003366;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                z-index: 1000;
              ">
                <div style="
                  width: 10px;
                  height: 10px;
                  background-color: #003366;
                  border-radius: 50%;
                  transform: rotate(45deg);
                "></div>
              </div>
            `,
            className: 'address-search-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
          }),
          zIndexOffset: 1000
        })

        // Lägg till markören på kartan
        marker.addTo(map)

        // Lägg till popup med adressinformation
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 200px;">
            <div style="color: #003366; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center;">
              <span style="margin-right: 6px;">📍</span>
              Vald adress
            </div>
            <div style="font-size: 13px; line-height: 1.4; color: #374151;">
              ${result.display_name}
            </div>
            ${result.address?.municipality ? `
              <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">
                📍 ${result.address.municipality}, Skåne län
              </div>
            ` : ''}
          </div>
        `
        
        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'address-search-popup'
        }).openPopup()

        // Spara markören för framtida borttagning
        setCurrentMarker(marker)

        console.log('✅ Markör placerad på:', lat, lng)

        // Ta bort markören automatiskt efter 15 sekunder
        setTimeout(() => {
          if (marker && map.hasLayer(marker)) {
            map.removeLayer(marker)
            setCurrentMarker(null)
            console.log('🧹 Automatisk borttagning av adressmarkör')
          }
        }, 15000)
      }, 500)
      
    } catch (error) {
      console.error('❌ Fel vid kartcentrering:', error)
    }
    
    // Uppdatera sökfältet med den valda adressen
    setSearchTerm(result.display_name)
    setShowResults(false)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowResults(false)
    
    // Rensa timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Ta bort markör om den finns
    if (currentMarker && map && map.hasLayer(currentMarker)) {
      map.removeLayer(currentMarker)
      setCurrentMarker(null)
      console.log('🧹 Manuell borttagning av adressmarkör')
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Sök adress i Skåne..."
          className="w-full pl-8 pr-8 py-2 text-sm border border-[#E5E7EB] rounded focus:ring-2 focus:ring-[#003366] focus:border-transparent"
          disabled={isSearching}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            title="Rensa sökning"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#003366]"></div>
          </div>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-[1001] max-h-64 overflow-y-auto">
          <div className="p-2 bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs text-[#003366] font-medium">
            📍 {searchResults.length} adresser i Skåne
          </div>
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => selectResult(result)}
              className="w-full text-left px-3 py-3 hover:bg-[#F3F4F6] border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-[#003366] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#003366] truncate">
                    {result.display_name}
                  </p>
                  {result.address && (
                    <p className="text-xs text-gray-500 mt-1">
                      {result.address.municipality || result.address.city || result.address.town || ''}
                      {result.address.county && `, ${result.address.county}`}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hjälptext */}
      <div className="mt-2 text-xs text-gray-500">
        <p>🔍 Sök fritt - inga begränsningar på antal tecken</p>
        <p>🎯 Endast adresser i Skåne län visas</p>
        <p>📍 Klicka på en adress för att centrera kartan</p>
      </div>
    </div>
  )
}