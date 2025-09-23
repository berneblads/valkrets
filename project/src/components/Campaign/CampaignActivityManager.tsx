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
  Mail,
  Home,
  Coffee,
  Info,
  Image,
  FileText,
  Megaphone,
  Phone,
  MessageSquare,
  Handshake
} from 'lucide-react'
import { campaignService, CampaignActivity } from '../../lib/campaignService'

const availableIcons = [
  { name: 'mail', component: Mail, label: 'Mail' },
  { name: 'home', component: Home, label: 'Home' },
  { name: 'coffee', component: Coffee, label: 'Coffee' },
  { name: 'info', component: Info, label: 'Info' },
  { name: 'image', component: Image, label: 'Image' },
  { name: 'file-text', component: FileText, label: 'Document' },
  { name: 'megaphone', component: Megaphone, label: 'Megaphone' },
  { name: 'phone', component: Phone, label: 'Phone' },
  { name: 'message-square', component: MessageSquare, label: 'Message' },
  { name: 'handshake', component: Handshake, label: 'Handshake' }
]

export function CampaignActivityManager() {
  const [activities, setActivities] = useState<CampaignActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingActivity, setEditingActivity] = useState<CampaignActivity | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'mail',
    is_active: true,
    sort_order: 0
  })

  useEffect(() => {
    loadCampaignActivities()
  }, [])

  const loadCampaignActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      const loadedActivities = await campaignService.getAllCampaignActivities()
      setActivities(loadedActivities)
    } catch (error) {
      console.error('Error loading campaign activities:', error)
      setError(error instanceof Error ? error.message : 'Fel vid laddning av kampanjaktiviteter')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateActivity = async () => {
    try {
      setError(null)
      const newActivity = await campaignService.createCampaignActivity({
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        is_active: formData.is_active,
        sort_order: formData.sort_order
      })
      
      if (newActivity) {
        setActivities(prev => [...prev, newActivity])
        setShowCreateModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating campaign activity:', error)
      setError(error instanceof Error ? error.message : 'Fel vid skapande av kampanjaktivitet')
    }
  }

  const handleUpdateActivity = async () => {
    if (!editingActivity) return
    
    try {
      setError(null)
      const updatedActivity = await campaignService.updateCampaignActivity(editingActivity.id, {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        is_active: formData.is_active,
        sort_order: formData.sort_order
      })
      
      if (updatedActivity) {
        setActivities(prev => 
          prev.map(activity => activity.id === updatedActivity.id ? updatedActivity : activity)
        )
        setEditingActivity(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error updating campaign activity:', error)
      setError(error instanceof Error ? error.message : 'Fel vid uppdatering av kampanjaktivitet')
    }
  }

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kampanjaktivitet?')) return
    
    try {
      setError(null)
      const success = await campaignService.deleteCampaignActivity(id)
      
      if (success) {
        setActivities(prev => prev.filter(activity => activity.id !== id))
      }
    } catch (error) {
      console.error('Error deleting campaign activity:', error)
      setError(error instanceof Error ? error.message : 'Fel vid borttagning av kampanjaktivitet')
    }
  }

  const handleToggleActive = async (activity: CampaignActivity) => {
    try {
      setError(null)
      const updatedActivity = await campaignService.updateCampaignActivity(activity.id, {
        is_active: !activity.is_active
      })
      
      if (updatedActivity) {
        setActivities(prev => 
          prev.map(a => a.id === updatedActivity.id ? updatedActivity : a)
        )
      }
    } catch (error) {
      console.error('Error toggling campaign activity active status:', error)
      setError(error instanceof Error ? error.message : 'Fel vid ändring av aktiv status')
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return
    
    try {
      const activityToMove = activities[index]
      const activityAbove = activities[index - 1]
      
      // Swap sort orders
      await Promise.all([
        campaignService.updateCampaignActivity(activityToMove.id, { sort_order: activityAbove.sort_order }),
        campaignService.updateCampaignActivity(activityAbove.id, { sort_order: activityToMove.sort_order })
      ])
      
      // Reload to get updated order
      await loadCampaignActivities()
    } catch (error) {
      console.error('Error moving campaign activity up:', error)
      setError(error instanceof Error ? error.message : 'Fel vid ändring av ordning')
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index >= activities.length - 1) return
    
    try {
      const activityToMove = activities[index]
      const activityBelow = activities[index + 1]
      
      // Swap sort orders
      await Promise.all([
        campaignService.updateCampaignActivity(activityToMove.id, { sort_order: activityBelow.sort_order }),
        campaignService.updateCampaignActivity(activityBelow.id, { sort_order: activityToMove.sort_order })
      ])
      
      // Reload to get updated order
      await loadCampaignActivities()
    } catch (error) {
      console.error('Error moving campaign activity down:', error)
      setError(error instanceof Error ? error.message : 'Fel vid ändring av ordning')
    }
  }

  const startEdit = (activity: CampaignActivity) => {
    setEditingActivity(activity)
    setFormData({
      name: activity.name,
      description: activity.description || '',
      icon: activity.icon || 'mail',
      is_active: activity.is_active,
      sort_order: activity.sort_order
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'mail',
      is_active: true,
      sort_order: activities.length
    })
  }

  const cancelEdit = () => {
    setEditingActivity(null)
    resetForm()
  }

  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find(i => i.name === iconName)
    return icon ? icon.component : Mail
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar kampanjaktiviteter...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#003366]">Kampanjaktiviteter</h2>
        <button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Skapa ny aktivitet</span>
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

      {/* Campaign Activities List */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Inga kampanjaktiviteter</h3>
            <p className="mt-1 text-sm text-gray-500">
              Skapa din första kampanjaktivitet för att komma igång.
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
                Skapa kampanjaktivitet
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[#E5E7EB]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktivitet
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
              {activities.map((activity, index) => {
                const IconComponent = getIconComponent(activity.icon || 'mail')
                
                return (
                  <tr key={activity.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#003366] flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#003366]">{activity.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {activity.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{activity.sort_order}</span>
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
                            disabled={index === activities.length - 1}
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
                          onClick={() => handleToggleActive(activity)}
                          className={`p-1 rounded transition-colors ${
                            activity.is_active 
                              ? 'text-green-600 hover:text-green-900 hover:bg-green-100' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title={activity.is_active ? 'Inaktivera' : 'Aktivera'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(activity)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors"
                          title="Redigera"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
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
      {(showCreateModal || editingActivity) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#003366]">
                {editingActivity ? 'Redigera kampanjaktivitet' : 'Skapa ny kampanjaktivitet'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingActivity(null)
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
                  placeholder="t.ex. Utdelning av flygblad"
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
                  placeholder="Beskriv denna kampanjaktivitet..."
                  rows={3}
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-2">
                  Ikon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableIcons.map(icon => {
                    const IconComponent = icon.component
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.name }))}
                        className={`p-2 border-2 rounded flex flex-col items-center justify-center transition-colors ${
                          formData.icon === icon.name
                            ? 'border-[#003366] bg-[#F3F4F6]'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title={icon.label}
                      >
                        <IconComponent className="w-5 h-5 mb-1" />
                        <span className="text-xs">{icon.label}</span>
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
                  setEditingActivity(null)
                }}
                className="px-4 py-2 text-[#003366] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={editingActivity ? handleUpdateActivity : handleCreateActivity}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingActivity ? 'Spara ändringar' : 'Skapa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}