import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  AlertTriangle, 
  Check, 
  ArrowUp, 
  ArrowDown,
  Palette,
  Home,
  Star,
  Calendar,
  Wifi,
  Map,
  Flag,
  Target,
  Users
} from 'lucide-react'
import { campaignService, CampaignType } from '../../lib/campaignService'

const availableIcons = [
  { name: 'home', component: Home },
  { name: 'star', component: Star },
  { name: 'calendar', component: Calendar },
  { name: 'wifi', component: Wifi },
  { name: 'map', component: Map },
  { name: 'flag', component: Flag },
  { name: 'target', component: Target },
  { name: 'users', component: Users }
]

const presetColors = [
  '#003366', // KD blue
  '#FFD700', // KD gold
  '#4A90E2', // Light blue
  '#50C878', // Emerald green
  '#FF6B6B', // Coral red
  '#9B59B6', // Purple
  '#F39C12', // Orange
  '#1ABC9C'  // Turquoise
]

export function CampaignTypeManager() {
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<CampaignType | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#003366',
    icon: 'home',
    is_active: true,
    sort_order: 0
  })

  useEffect(() => {
    loadCampaignTypes()
  }, [])

  const loadCampaignTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const types = await campaignService.getAllCampaignTypes()
      setCampaignTypes(types)
    } catch (error) {
      console.error('Error loading campaign types:', error)
      setError(error instanceof Error ? error.message : 'Fel vid laddning av kampanjtyper')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateType = async () => {
    try {
      setError(null)
      const newType = await campaignService.createCampaignType({
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        is_active: formData.is_active,
        sort_order: formData.sort_order
      })
      
      if (newType) {
        setCampaignTypes(prev => [...prev, newType])
        setShowCreateModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating campaign type:', error)
      setError(error instanceof Error ? error.message : 'Fel vid skapande av kampanjtyp')
    }
  }

  const handleUpdateType = async () => {
    if (!editingType) return
    
    try {
      setError(null)
      const updatedType = await campaignService.updateCampaignType(editingType.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        is_active: formData.is_active,
        sort_order: formData.sort_order
      })
      
      if (updatedType) {
        setCampaignTypes(prev => 
          prev.map(type => type.id === updatedType.id ? updatedType : type)
        )
        setEditingType(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error updating campaign type:', error)
      setError(error instanceof Error ? error.message : 'Fel vid uppdatering av kampanjtyp')
    }
  }

  const handleDeleteType = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kampanjtyp?')) return
    
    try {
      setError(null)
      const success = await campaignService.deleteCampaignType(id)
      
      if (success) {
        setCampaignTypes(prev => prev.filter(type => type.id !== id))
      }
    } catch (error) {
      console.error('Error deleting campaign type:', error)
      setError(error instanceof Error ? error.message : 'Fel vid borttagning av kampanjtyp')
    }
  }

  const handleToggleActive = async (type: CampaignType) => {
    try {
      setError(null)
      const updatedType = await campaignService.updateCampaignType(type.id, {
        is_active: !type.is_active
      })
      
      if (updatedType) {
        setCampaignTypes(prev => 
          prev.map(t => t.id === updatedType.id ? updatedType : t)
        )
      }
    } catch (error) {
      console.error('Error toggling campaign type active status:', error)
      setError(error instanceof Error ? error.message : 'Fel vid ändring av aktiv status')
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return
    
    try {
      const typeToMove = campaignTypes[index]
      const typeAbove = campaignTypes[index - 1]
      
      // Swap sort orders
      await Promise.all([
        campaignService.updateCampaignType(typeToMove.id, { sort_order: typeAbove.sort_order }),
        campaignService.updateCampaignType(typeAbove.id, { sort_order: typeToMove.sort_order })
      ])
      
      // Reload to get updated order
      await loadCampaignTypes()
    } catch (error) {
      console.error('Error moving campaign type up:', error)
      setError(error instanceof Error ? error.message : 'Fel vid ändring av ordning')
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index >= campaignTypes.length - 1) return
    
    try {
      const typeToMove = campaignTypes[index]
      const typeBelow = campaignTypes[index + 1]
      
      // Swap sort orders
      await Promise.all([
        campaignService.updateCampaignType(typeToMove.id, { sort_order: typeBelow.sort_order }),
        campaignService.updateCampaignType(typeBelow.id, { sort_order: typeToMove.sort_order })
      ])
      
      // Reload to get updated order
      await loadCampaignTypes()
    } catch (error) {
      console.error('Error moving campaign type down:', error)
      setError(error instanceof Error ? error.message : 'Fel vid ändring av ordning')
    }
  }

  const startEdit = (type: CampaignType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      color: type.color,
      icon: type.icon || 'home',
      is_active: type.is_active,
      sort_order: type.sort_order
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#003366',
      icon: 'home',
      is_active: true,
      sort_order: campaignTypes.length
    })
  }

  const cancelEdit = () => {
    setEditingType(null)
    resetForm()
  }

  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find(i => i.name === iconName)
    return icon ? icon.component : Home
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar kampanjtyper...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#003366]">Kampanjtyper</h2>
        <button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Skapa ny typ</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Campaign Types List */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        {campaignTypes.length === 0 ? (
          <div className="text-center py-12">
            <Map className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Inga kampanjtyper</h3>
            <p className="mt-1 text-sm text-gray-500">
              Skapa din första kampanjtyp för att komma igång.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm()
                  setShowCreateModal(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Skapa kampanjtyp
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[#E5E7EB]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beskrivning
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordning
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {campaignTypes.map((type, index) => {
                const IconComponent = getIconComponent(type.icon || 'home')
                
                return (
                  <tr key={type.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: type.color }}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-sm font-medium text-[#003366]">{type.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {type.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{type.sort_order}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-[#003366] disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === campaignTypes.length - 1}
                            className="text-gray-400 hover:text-[#003366] disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(type)}
                          className={`p-1 rounded transition-colors ${
                            type.is_active 
                              ? 'text-green-600 hover:text-green-900 hover:bg-green-100' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title={type.is_active ? 'Inaktivera' : 'Aktivera'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(type)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors"
                          title="Redigera"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
                          title="Ta bort"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingType) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#003366]">
                {editingType ? 'Redigera kampanjtyp' : 'Skapa ny kampanjtyp'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingType(null)
                }}
                className="p-2 hover:bg-[#F3F4F6] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-1">
                  Namn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="t.ex. Standard kampanj"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-1">
                  Beskrivning
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="Beskriv denna kampanjtyp..."
                  rows={3}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-2">
                  Färg
                </label>
                
                {/* Color Preview */}
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-12 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-sm text-gray-600 font-mono">{formData.color}</span>
                </div>

                {/* Preset Colors */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presetColors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                        formData.color === color 
                          ? 'border-[#003366] shadow-lg' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Färg ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded focus:ring-2 focus:ring-[#003366] font-mono text-sm"
                    placeholder="#003366"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-2">
                  Ikon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableIcons.map(icon => {
                    const IconComponent = icon.component
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.name }))}
                        className={`p-2 border-2 rounded flex items-center justify-center transition-colors ${
                          formData.icon === icon.name
                            ? 'border-[#003366] bg-[#F3F4F6]'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-[#003366] focus:ring-[#003366] border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Aktiv
                </label>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-1">
                  Sorteringsordning
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingType(null)
                }}
                className="px-4 py-2 text-[#003366] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={editingType ? handleUpdateType : handleCreateType}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingType ? 'Spara ändringar' : 'Skapa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}