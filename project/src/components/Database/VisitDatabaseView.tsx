import React, { useState, useEffect } from 'react'
import { 
  Home, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  MessageSquare,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Loader
} from 'lucide-react'
import { HouseVisitData } from '../Map/HouseVisitForm'
import { Minimap } from '../Map/Minimap'

interface VisitDatabaseViewProps {
  visits: HouseVisitData[]
  onDeleteVisit: (visitId: string) => void
  onEditVisit?: (visit: HouseVisitData) => void
  loading?: boolean
}

type SortField = 'timestamp' | 'visitType' | 'address' | 'doorKnockResult'
type SortDirection = 'asc' | 'desc'

export function VisitDatabaseView({ visits, onDeleteVisit, onEditVisit, loading = false }: VisitDatabaseViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterResult, setFilterResult] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedVisit, setSelectedVisit] = useState<HouseVisitData | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showMinimap, setShowMinimap] = useState<string | null>(null)
  const [minimapAddress, setMinimapAddress] = useState<string>('')
  const [loadingAddress, setLoadingAddress] = useState(false)

  const getVisitTypeLabel = (visitType: HouseVisitData['visitType']) => {
    switch (visitType) {
      case 'hus':
        return 'Hus identifierat'
      case 'knackat_dörr':
        return 'Knackat dörr'
      case 'pratat_med_boende':
        return 'Pratat med boende'
      case 'partist':
        return 'Partist'
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
        return 'Öppnade inte'
      case 'ville_inte_prata':
        return 'Ville inte prata'
      case 'positiv':
        return 'Positiv'
      case 'negativ':
        return 'Negativ'
      default:
        return result
    }
  }

  const getResultIcon = (result?: HouseVisitData['doorKnockResult']) => {
    switch (result) {
      case 'positiv':
        return <ThumbsUp className="w-4 h-4 text-green-600" />
      case 'negativ':
        return <ThumbsDown className="w-4 h-4 text-red-600" />
      case 'ville_inte_prata':
        return <X className="w-4 h-4 text-yellow-600" />
      case 'boende_öppnade_inte':
        return <AlertCircle className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getVisitTypeIcon = (visitType: HouseVisitData['visitType']) => {
    switch (visitType) {
      case 'hus':
        return <Home className="w-4 h-4 text-blue-600" />
      case 'knackat_dörr':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case 'pratat_med_boende':
        return <MessageSquare className="w-4 h-4 text-purple-600" />
      case 'partist':
        return <ThumbsUp className="w-4 h-4 text-green-600" />
      case 'blev_medlem':
        return <UserPlus className="w-4 h-4 text-emerald-600" />
      default:
        return <Home className="w-4 h-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('sv-SE'),
      time: date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Reverse geocoding using Supabase Edge Function (CORS-free)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      setLoadingAddress(true)
      
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
      
      return data.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } finally {
      setLoadingAddress(false)
    }
  }

  // Filtrera och sortera besök
  const filteredAndSortedVisits = React.useMemo(() => {
    let filtered = visits.filter(visit => {
      // Textsökning
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        visit.address?.toLowerCase().includes(searchLower) ||
        visit.notes.toLowerCase().includes(searchLower) ||
        getVisitTypeLabel(visit.visitType).toLowerCase().includes(searchLower)

      // Typ-filter
      const matchesType = filterType === 'all' || visit.visitType === filterType

      // Resultat-filter
      const matchesResult = filterResult === 'all' || 
        (filterResult === 'none' && !visit.doorKnockResult) ||
        visit.doorKnockResult === filterResult

      return matchesSearch && matchesType && matchesResult
    })

    // Sortering
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        case 'visitType':
          aValue = getVisitTypeLabel(a.visitType)
          bValue = getVisitTypeLabel(b.visitType)
          break
        case 'address':
          aValue = a.address || ''
          bValue = b.address || ''
          break
        case 'doorKnockResult':
          aValue = getDoorKnockResultLabel(a.doorKnockResult) || ''
          bValue = getDoorKnockResultLabel(b.doorKnockResult) || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [visits, searchTerm, filterType, filterResult, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Datum',
      'Tid',
      'Typ',
      'Resultat',
      'Adress',
      'Koordinater',
      'Anteckningar'
    ]

    const csvData = filteredAndSortedVisits.map(visit => {
      const { date, time } = formatTimestamp(visit.timestamp)
      return [
        date,
        time,
        getVisitTypeLabel(visit.visitType),
        getDoorKnockResultLabel(visit.doorKnockResult) || '',
        visit.address || '',
        `${visit.position.lat.toFixed(6)}, ${visit.position.lng.toFixed(6)}`,
        visit.notes.replace(/"/g, '""') // Escape quotes
      ]
    })

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `husbesok-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getStatistics = () => {
    const total = visits.length
    const byType = visits.reduce((acc, visit) => {
      acc[visit.visitType] = (acc[visit.visitType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const doorKnockResults = visits
      .filter(v => v.visitType === 'knackat_dörr' && v.doorKnockResult)
      .reduce((acc, visit) => {
        if (visit.doorKnockResult) {
          acc[visit.doorKnockResult] = (acc[visit.doorKnockResult] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

    return { total, byType, doorKnockResults }
  }

  const handleShowMinimap = async (visitId: string) => {
    const visit = visits.find(v => v.id === visitId)
    if (!visit) return

    setShowMinimap(visitId)
    
    // If visit already has an address, use it
    if (visit.address) {
      setMinimapAddress(visit.address)
    } else {
      // Otherwise, look up address based on coordinates
      const address = await reverseGeocode(visit.position.lat, visit.position.lng)
      setMinimapAddress(address)
    }
  }

  const handleCloseMinimap = () => {
    setShowMinimap(null)
    setMinimapAddress('')
  }

  const stats = getStatistics()

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Laddar husbesök från Supabase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Home className="w-6 h-6 mr-2" />
          Husbesöksdatabas
        </h1>
        <p className="text-gray-600">Hantera och analysera alla registrerade husbesök</p>
      </div>

      {/* Statistics Cards - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Home className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Totalt besök</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Dörrknackning</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.byType.knackat_dörr || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <ThumbsUp className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Positiva</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.doorKnockResults.positiv || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <ThumbsDown className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Negativa</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.doorKnockResults.negativ || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <UserPlus className="w-8 h-8 text-emerald-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Medlemmar</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.byType.blev_medlem || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="search-visits"
                name="searchVisits"
                type="text"
                placeholder="Sök adress, anteckningar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportera</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="filter-visit-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Typ av besök
                </label>
                <select
                  id="filter-visit-type"
                  name="filterVisitType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Alla typer</option>
                  <option value="hus">Hus identifierat</option>
                  <option value="knackat_dörr">Knackat dörr</option>
                  <option value="pratat_med_boende">Pratat med boende</option>
                  <option value="partist">Partist</option>
                  <option value="blev_medlem">Blev medlem</option>
                </select>
              </div>

              <div>
                <label htmlFor="filter-door-knock-result" className="block text-sm font-medium text-gray-700 mb-1">
                  Dörrknackningsresultat
                </label>
                <select
                  id="filter-door-knock-result"
                  name="filterDoorKnockResult"
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Alla resultat</option>
                  <option value="none">Inget resultat</option>
                  <option value="positiv">Positiv</option>
                  <option value="negativ">Negativ</option>
                  <option value="ville_inte_prata">Ville inte prata</option>
                  <option value="boende_öppnade_inte">Öppnade inte</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <p className="text-sm text-gray-600">
          Visar {filteredAndSortedVisits.length} av {visits.length} besök
        </p>
      </div>

      {/* Visits Table - Scrollable */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="h-full overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Datum & Tid</span>
                    {sortField === 'timestamp' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('visitType')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Typ</span>
                    {sortField === 'visitType' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('address')}
                >
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Adress</span>
                    {sortField === 'address' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('doorKnockResult')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Resultat</span>
                    {sortField === 'doorKnockResult' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedVisits.map((visit) => {
                const { date, time } = formatTimestamp(visit.timestamp)
                const isMinimapOpen = showMinimap === visit.id
                
                return (
                  <React.Fragment key={visit.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{date}</div>
                        <div className="text-sm text-gray-500">{time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getVisitTypeIcon(visit.visitType)}
                          <span className="text-sm text-gray-900">{getVisitTypeLabel(visit.visitType)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{visit.address || 'Ingen adress'}</div>
                        <div className="text-xs text-gray-500">
                          {visit.position.lat.toFixed(6)}, {visit.position.lng.toFixed(6)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {visit.doorKnockResult ? (
                          <div className="flex items-center space-x-2">
                            {getResultIcon(visit.doorKnockResult)}
                            <span className="text-sm text-gray-900">{getDoorKnockResultLabel(visit.doorKnockResult)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => isMinimapOpen ? handleCloseMinimap() : handleShowMinimap(visit.id)}
                            className={`transition-colors ${
                              isMinimapOpen 
                                ? 'text-blue-700 bg-blue-100' 
                                : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                            } p-1 rounded`}
                            title={isMinimapOpen ? "Stäng karta" : "Visa på karta"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onEditVisit && (
                            <button
                              onClick={() => onEditVisit(visit)}
                              className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors"
                              title="Redigera"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteVisit(visit.id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Ta bort"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Minimap Row */}
                    {isMinimapOpen && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 max-w-md">
                              {loadingAddress ? (
                                <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                              ) : (
                                <Minimap 
                                  position={visit.position}
                                  address={minimapAddress}
                                />
                              )}
                            </div>
                            
                            <div className="ml-6 flex-1">
                              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <Home className="w-4 h-4 mr-2" />
                                  Besöksdetaljer
                                </h4>
                                
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Typ:</span>
                                    <span className="ml-2 text-gray-900">{getVisitTypeLabel(visit.visitType)}</span>
                                  </div>
                                  
                                  {visit.doorKnockResult && (
                                    <div>
                                      <span className="font-medium text-gray-700">Resultat:</span>
                                      <div className="ml-2 inline-flex items-center space-x-1">
                                        {getResultIcon(visit.doorKnockResult)}
                                        <span className="text-gray-900">{getDoorKnockResultLabel(visit.doorKnockResult)}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <span className="font-medium text-gray-700">Koordinater:</span>
                                    <span className="ml-2 text-gray-900 font-mono text-xs">
                                      {visit.position.lat.toFixed(6)}, {visit.position.lng.toFixed(6)}
                                    </span>
                                  </div>
                                  
                                  {visit.notes && (
                                    <div>
                                      <span className="font-medium text-gray-700">Anteckningar:</span>
                                      <p className="ml-2 text-gray-900 mt-1 text-xs bg-gray-50 p-2 rounded">
                                        {visit.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={handleCloseMinimap}
                              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                              title="Stäng"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          {filteredAndSortedVisits.length === 0 && (
            <div className="text-center py-12">
              <Home className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Inga besök hittades</h3>
              <p className="mt-1 text-sm text-gray-500">
                {visits.length === 0 
                  ? 'Börja registrera husbesök på kartan för att se dem här.'
                  : 'Prova att ändra sökkriterier eller filter.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                {getVisitTypeIcon(selectedVisit.visitType)}
                <span className="ml-2">Besöksdetaljer</span>
              </h3>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Typ:</label>
                <p className="text-sm text-gray-900">{getVisitTypeLabel(selectedVisit.visitType)}</p>
              </div>

              {selectedVisit.address && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Adress:</label>
                  <p className="text-sm text-gray-900">{selectedVisit.address}</p>
                </div>
              )}

              {selectedVisit.fullAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Fullständig adress:</label>
                  <div className="text-sm text-gray-900 space-y-1">
                    {selectedVisit.fullAddress.street && selectedVisit.fullAddress.houseNumber && (
                      <p>Gata: {selectedVisit.fullAddress.street} {selectedVisit.fullAddress.houseNumber}</p>
                    )}
                    {selectedVisit.fullAddress.city && <p>Ort: {selectedVisit.fullAddress.city}</p>}
                    {selectedVisit.fullAddress.postalCode && <p>Postnummer: {selectedVisit.fullAddress.postalCode}</p>}
                    {selectedVisit.fullAddress.county && <p>Län: {selectedVisit.fullAddress.county}</p>}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Koordinater:</label>
                <p className="text-sm text-gray-900">
                  {selectedVisit.position.lat.toFixed(6)}, {selectedVisit.position.lng.toFixed(6)}
                </p>
              </div>

              {selectedVisit.doorKnockResult && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Dörrknackningsresultat:</label>
                  <div className="flex items-center space-x-2">
                    {getResultIcon(selectedVisit.doorKnockResult)}
                    <span className="text-sm text-gray-900">{getDoorKnockResultLabel(selectedVisit.doorKnockResult)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Datum och tid:</label>
                <p className="text-sm text-gray-900">
                  {formatTimestamp(selectedVisit.timestamp).date} {formatTimestamp(selectedVisit.timestamp).time}
                </p>
              </div>

              {selectedVisit.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Anteckningar:</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedVisit.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}