import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Edit, Trash2, MapPin, Route, Square, Circle, Users, Plus, Palette } from 'lucide-react'
import { teamService } from '../../lib/teamService'

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

interface DrawnObjectsPanelProps {
  objects: DrawnObject[]
  onToggleVisibility: (id: string) => void
  onDeleteObject: (id: string) => void
  onEditObject: (id: string) => void
  onClose: () => void
  onTeamAssignment?: (objectId: string, team: string) => void
  onColorChange?: (objectId: string, color: string) => void
}

const objectTypeIcons: Record<string, React.ComponentType<any>> = {
  kampanjområde: Square,
  rutt: Route,
  mötesplats: MapPin,
  viktigt_område: Circle,
  undvik_område: X,
  samlingspunkt: MapPin,
  parkering: Square,
  toalett: MapPin
}

const presetColors = [
  '#003366', // KD blue
  '#FFD700', // KD gold
  '#60a5fa', // blue
  '#f87171', // red
  '#34d399', // green
  '#fbbf24', // yellow
  '#a78bfa', // purple
  '#22d3ee', // cyan
  '#fb7185', // pink
  '#a3e635', // lime
  '#f97316', // orange
  '#8b5cf6'  // violet
]

export function DrawnObjectsPanel({ 
  objects, 
  onToggleVisibility, 
  onDeleteObject, 
  onEditObject, 
  onClose,
  onTeamAssignment,
  onColorChange
}: DrawnObjectsPanelProps) {
  const [filter, setFilter] = useState<string>('all')
  const [teams, setTeams] = useState<{ value: string; label: string; color: string }[]>([])
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)

  // Load teams from the new team service
  useEffect(() => {
    loadTeams()
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

  const filteredObjects = objects.filter(obj => 
    filter === 'all' || obj.type === filter
  )

  const objectTypes = Array.from(new Set(objects.map(obj => obj.type)))

  const handleTeamAssignment = (objectId: string, teamId: string) => {
    if (onTeamAssignment) {
      // Find team name by ID
      const team = teams.find(t => t.value === teamId)
      onTeamAssignment(objectId, team?.label || teamId)
    }
  }

  const handleColorChange = (objectId: string, color: string) => {
    if (onColorChange) {
      onColorChange(objectId, color)
    }
    setEditingColor(null)
  }

  const handleDeleteWithConfirm = (objectId: string) => {
    const object = objects.find(obj => obj.id === objectId)
    if (object && confirm(`Är du säker på att du vill ta bort "${object.name}"?`)) {
      onDeleteObject(objectId)
    }
  }

  return (
    <div className="h-full">
      {/* Filter */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <label className="block text-xs font-medium text-[#003366] mb-1">
          Filtrera efter typ:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#003366]"
        >
          <option value="all">Alla typer ({objects.length})</option>
          {objectTypes.map(type => (
            <option key={type} value={type}>
              {type} ({objects.filter(obj => obj.type === type).length})
            </option>
          ))}
        </select>
      </div>

      {/* Objects List */}
      <div className="flex-1 overflow-y-auto">
        {filteredObjects.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {filter === 'all' ? 'Inga objekt ritade än' : `Inga objekt av typ "${filter}"`}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredObjects.map((obj) => {
              const IconComponent = objectTypeIcons[obj.type] || MapPin
              
              return (
                <div key={obj.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start space-x-2">
                    <div 
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 border-2 border-white shadow-sm"
                      style={{ backgroundColor: obj.color }}
                    >
                      <IconComponent size={12} className="text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-[#003366] truncate">
                        {obj.name}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {obj.type.replace('_', ' ')}
                      </p>
                      {obj.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {obj.description}
                        </p>
                      )}
                      
                      {/* Color Picker - Förbättrad för att ändra färg direkt */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-[#003366] mb-1">
                          Färg:
                        </label>
                        {editingColor === obj.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-1">
                              {presetColors.map((color, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleColorChange(obj.id, color)}
                                  className="w-6 h-6 rounded border-2 border-gray-300 hover:border-[#003366] transition-colors"
                                  style={{ backgroundColor: color }}
                                  title={`Färg ${index + 1}`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center space-x-1">
                              <input
                                type="color"
                                value={obj.color}
                                onChange={(e) => handleColorChange(obj.id, e.target.value)}
                                className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                              />
                              <button
                                onClick={() => setEditingColor(null)}
                                className="text-xs text-gray-500 hover:text-[#003366]"
                              >
                                Stäng
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingColor(obj.id)}
                            className="flex items-center space-x-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            <div 
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: obj.color }}
                            />
                            <Palette className="w-3 h-3 text-gray-500" />
                          </button>
                        )}
                      </div>
                      
                      {/* Team Assignment - Now using dynamic teams */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-[#003366] mb-1">
                          Tilldela team:
                        </label>
                        {loadingTeams ? (
                          <div className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-gray-50 text-gray-500">
                            Laddar teams...
                          </div>
                        ) : (
                          <select
                            value={teams.find(t => t.label === obj.teamAssignment)?.value || ''}
                            onChange={(e) => handleTeamAssignment(obj.id, e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-[#003366]"
                          >
                            <option value="">Ej tilldelad</option>
                            {teams.map(team => (
                              <option key={team.value} value={team.value}>{team.label}</option>
                            ))}
                          </select>
                        )}
                        {obj.teamAssignment && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-1 text-xs bg-[#003366] text-white rounded">
                              Tilldelat: {obj.teamAssignment}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex flex-col items-center space-y-1">
                      <button
                        onClick={() => onToggleVisibility(obj.id)}
                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                          obj.visible ? 'text-[#003366]' : 'text-gray-400'
                        }`}
                        title={obj.visible ? 'Dölj' : 'Visa'}
                      >
                        {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      
                      <button
                        onClick={() => onEditObject(obj.id)}
                        className="p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                        title="Redigera"
                      >
                        <Edit size={12} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteWithConfirm(obj.id)}
                        className="p-1 rounded hover:bg-gray-200 text-red-600 transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p>Totalt: {objects.length} objekt</p>
          <p>Synliga: {objects.filter(obj => obj.visible).length}</p>
          <p>Med team: {objects.filter(obj => obj.teamAssignment).length}</p>
        </div>
      </div>
    </div>
  )
}