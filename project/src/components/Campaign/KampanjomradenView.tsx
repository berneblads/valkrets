import React, { useState, useEffect } from 'react'
import { 
  MapPin, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Users,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  Calendar,
  Loader
} from 'lucide-react'

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

interface KampanjomradenViewProps {
  objects: DrawnObject[]
  onToggleVisibility: (id: string) => void
  onDeleteObject: (id: string) => void
  onEditObject: (id: string) => void
  onTeamAssignment: (objectId: string, team: string) => void
  onClose?: () => void
}

const teams = ['Team A', 'Team B', 'Team C', 'Team D']

const objectTypeLabels: Record<string, string> = {
  kampanjområde: 'Kampanjområde',
  rutt: 'Kampanjrutt',
  mötesplats: 'Mötesplats',
  viktigt_område: 'Viktigt område',
  undvik_område: 'Område att undvika',
  samlingspunkt: 'Samlingspunkt',
  parkering: 'Parkering',
  toalett: 'Toalett/Vila'
}

const objectTypeIcons: Record<string, React.ComponentType<any>> = {
  kampanjområde: MapPin,
  rutt: MapPin,
  mötesplats: Users,
  viktigt_område: AlertTriangle,
  undvik_område: X,
  samlingspunkt: Users,
  parkering: Square,
  toalett: MapPin
}

export function KampanjomradenView({ 
  objects, 
  onToggleVisibility, 
  onDeleteObject, 
  onEditObject,
  onTeamAssignment,
  onClose
}: KampanjomradenViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Filter objects based on search and filters
  const filteredObjects = React.useMemo(() => {
    let filtered = objects

    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(obj => 
        obj.name.toLowerCase().includes(searchLower) ||
        obj.description.toLowerCase().includes(searchLower) ||
        objectTypeLabels[obj.type]?.toLowerCase().includes(searchLower)
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(obj => obj.type === filterType)
    }

    // Team filter
    if (filterTeam !== 'all') {
      if (filterTeam === 'unassigned') {
        filtered = filtered.filter(obj => !obj.teamAssignment)
      } else {
        filtered = filtered.filter(obj => obj.teamAssignment === filterTeam)
      }
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [objects, searchTerm, filterType, filterTeam])

  const handleDeleteWithConfirm = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDeleteObject(deleteConfirm)
      setDeleteConfirm(null)
      setSelectedObjects(prev => {
        const newSet = new Set(prev)
        newSet.delete(deleteConfirm)
        return newSet
      })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  const toggleObjectSelection = (id: string) => {
    setSelectedObjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAllVisible = () => {
    setSelectedObjects(new Set(filteredObjects.map(obj => obj.id)))
  }

  const clearSelection = () => {
    setSelectedObjects(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedObjects.size > 0 && confirm(`Ta bort ${selectedObjects.size} valda områden?`)) {
      selectedObjects.forEach(id => onDeleteObject(id))
      setSelectedObjects(new Set())
    }
  }

  const handleBulkTeamAssignment = (team: string) => {
    selectedObjects.forEach(id => onTeamAssignment(id, team))
    setSelectedObjects(new Set())
  }

  const exportData = () => {
    const data = filteredObjects.map(obj => ({
      Namn: obj.name,
      Typ: objectTypeLabels[obj.type] || obj.type,
      Beskrivning: obj.description,
      Team: obj.teamAssignment || 'Ej tilldelad',
      Synlig: obj.visible ? 'Ja' : 'Nej',
      Skapad: new Date(obj.created_at).toLocaleDateString('sv-SE')
    }))

    const csvContent = [
      'Namn,Typ,Beskrivning,Team,Synlig,Skapad',
      ...data.map(row => Object.values(row).map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `kampanjomraden-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getStats = () => {
    const total = objects.length
    const byType = objects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const byTeam = objects.reduce((acc, obj) => {
      const team = obj.teamAssignment || 'Ej tilldelad'
      acc[team] = (acc[team] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const visible = objects.filter(obj => obj.visible).length

    return { total, byType, byTeam, visible }
  }

  const stats = getStats()

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <MapPin className="w-6 h-6 mr-2" />
              Kampanjområden
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {stats.total} områden • {stats.visible} synliga
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex-shrink-0 bg-gray-50 p-3 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-xs text-gray-600">Totalt</p>
                <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-xs text-gray-600">Med team</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.total - (stats.byTeam['Ej tilldelad'] || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Sök områden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportData}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Exportera</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Typ av område
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">Alla typer</option>
                  {Object.entries(objectTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">Alla team</option>
                  <option value="unassigned">Ej tilldelade</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedObjects.size > 0 && (
        <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-blue-700 font-medium">
                {selectedObjects.size} valda
              </span>
              <button
                onClick={selectAllVisible}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Välj alla synliga
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Rensa urval
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => e.target.value && handleBulkTeamAssignment(e.target.value)}
                className="px-2 py-1 border border-blue-300 rounded text-sm"
                defaultValue=""
              >
                <option value="">Tilldela team...</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <Trash2 className="w-3 h-3" />
                <span>Ta bort</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Objects List */}
      <div className="flex-1 overflow-y-auto">
        {filteredObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MapPin className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {objects.length === 0 ? 'Inga kampanjområden än' : 'Inga områden matchar filtren'}
            </h3>
            <p className="text-gray-500 max-w-sm">
              {objects.length === 0 
                ? 'Börja rita kampanjområden på kartan för att se dem här.'
                : 'Prova att ändra sökkriterier eller filter för att se fler områden.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredObjects.map((object) => {
              const IconComponent = objectTypeIcons[object.type] || MapPin
              const isSelected = selectedObjects.has(object.id)
              
              return (
                <div
                  key={object.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => toggleObjectSelection(object.id)}
                      className="mt-1 p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {/* Object Icon */}
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1"
                      style={{ backgroundColor: `${object.color}20`, color: object.color }}
                    >
                      <IconComponent size={16} />
                    </div>
                    
                    {/* Object Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {object.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {objectTypeLabels[object.type] || object.type}
                          </p>
                          {object.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {object.description}
                            </p>
                          )}
                          
                          {/* Team Assignment */}
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Team:
                            </label>
                            <select
                              value={object.teamAssignment || ''}
                              onChange={(e) => onTeamAssignment(object.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Ej tilldelad</option>
                              {teams.map(team => (
                                <option key={team} value={team}>{team}</option>
                              ))}
                            </select>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(object.created_at).toLocaleDateString('sv-SE')}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              object.visible 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {object.visible ? 'Synlig' : 'Dold'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex items-center space-x-1 ml-3">
                          <button
                            onClick={() => onToggleVisibility(object.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title={object.visible ? 'Dölj område' : 'Visa område'}
                          >
                            {object.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => onEditObject(object.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Redigera område"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteWithConfirm(object.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Ta bort område"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Bekräfta borttagning
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Är du säker på att du vill ta bort detta kampanjområde? 
              Denna åtgärd kan inte ångras.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Ta bort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}