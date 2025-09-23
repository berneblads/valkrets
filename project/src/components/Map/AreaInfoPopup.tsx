import React, { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus,
  Mail,
  Home,
  Coffee,
  Info,
  Image,
  FileText,
  Megaphone,
  Phone,
  MessageSquare,
  Handshake,
  Trash2
} from 'lucide-react'
import { teamService } from '../../lib/teamService'
import { campaignService, CampaignActivity, AreaActivity } from '../../lib/campaignService'

interface AreaInfoPopupProps {
  areaId: string
  areaName: string
  areaType: string
  onClose: () => void
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'mail': Mail,
    'home': Home,
    'coffee': Coffee,
    'info': Info,
    'image': Image,
    'file-text': FileText,
    'megaphone': Megaphone,
    'phone': Phone,
    'message-square': MessageSquare,
    'handshake': Handshake
  }
  
  return iconMap[iconName] || Info
}

export function AreaInfoPopup({ areaId, areaName, areaType, onClose }: AreaInfoPopupProps) {
  const [activities, setActivities] = useState<AreaActivity[]>([])
  const [availableActivities, setAvailableActivities] = useState<CampaignActivity[]>([])
  const [teams, setTeams] = useState<{ value: string; label: string; color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({
    activity_id: '',
    team_id: '',
    scheduled_date: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [areaId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load area activities
      const areaActivities = await campaignService.getAreaActivities(areaId)
      setActivities(areaActivities)
      
      // Load available activities
      const availableActs = await campaignService.getActiveCampaignActivities()
      setAvailableActivities(availableActs)
      
      // Load teams
      const teamOptions = await teamService.getTeamOptions()
      setTeams(teamOptions)
    } catch (error) {
      console.error('Error loading area info data:', error)
      setError('Kunde inte ladda områdesinformation')
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    try {
      if (!newActivity.activity_id) {
        setError('Välj en aktivitet')
        return
      }
      
      setError(null)
      const result = await campaignService.createAreaActivity({
        area_id: areaId,
        activity_id: newActivity.activity_id,
        team_id: newActivity.team_id || undefined,
        scheduled_date: newActivity.scheduled_date || undefined,
        notes: newActivity.notes || undefined
      })
      
      if (result) {
        // Reload activities to get the full data with relations
        await loadData()
        setShowAddActivity(false)
        setNewActivity({
          activity_id: '',
          team_id: '',
          scheduled_date: '',
          notes: ''
        })
      }
    } catch (error) {
      console.error('Error adding activity:', error)
      setError(error instanceof Error ? error.message : 'Fel vid tillägg av aktivitet')
    }
  }

  const handleUpdateActivityStatus = async (id: string, status: 'planned' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      setError(null)
      
      const updates: any = { status }
      if (status === 'completed') {
        updates.completed_date = new Date().toISOString().split('T')[0]
      }
      
      const result = await campaignService.updateAreaActivity(id, updates)
      
      if (result) {
        setActivities(prev => 
          prev.map(activity => activity.id === id ? { ...activity, ...updates } : activity)
        )
      }
    } catch (error) {
      console.error('Error updating activity status:', error)
      setError(error instanceof Error ? error.message : 'Fel vid uppdatering av aktivitetsstatus')
    }
  }

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna aktivitet?')) return
    
    try {
      setError(null)
      const success = await campaignService.deleteAreaActivity(id)
      
      if (success) {
        setActivities(prev => prev.filter(activity => activity.id !== id))
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
      setError(error instanceof Error ? error.message : 'Fel vid borttagning av aktivitet')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planerad'
      case 'in_progress':
        return 'Pågående'
      case 'completed':
        return 'Slutförd'
      case 'cancelled':
        return 'Avbruten'
      default:
        return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#003366] text-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{areaName}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#004080] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Area Info */}
          <div className="mb-4 p-3 bg-[#F9FAFB] rounded-lg">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm text-gray-500">Typ</p>
                <p className="text-sm font-medium text-[#003366] capitalize">{areaType.replace('_', ' ')}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">ID</p>
                <p className="text-sm font-medium text-[#003366]">{areaId.substring(0, 8)}...</p>
              </div>
            </div>
          </div>

          {/* Activities Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-[#003366]">Kampanjaktiviteter</h3>
              <button
                onClick={() => setShowAddActivity(!showAddActivity)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-[#003366] text-white rounded hover:bg-[#004080] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Lägg till</span>
              </button>
            </div>

            {/* Add Activity Form */}
            {showAddActivity && (
              <div className="mb-4 p-3 bg-[#F9FAFB] rounded-lg">
                <h4 className="text-sm font-medium text-[#003366] mb-3">Lägg till ny aktivitet</h4>
                
                <div className="space-y-3">
                  {/* Activity Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Aktivitet *
                    </label>
                    <select
                      value={newActivity.activity_id}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, activity_id: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#003366]"
                    >
                      <option value="">Välj aktivitet</option>
                      {availableActivities.map(activity => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Team Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Team
                    </label>
                    <select
                      value={newActivity.team_id}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, team_id: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#003366]"
                    >
                      <option value="">Inget team</option>
                      {teams.map(team => (
                        <option key={team.value} value={team.value}>
                          {team.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Scheduled Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Planerat datum
                    </label>
                    <input
                      type="date"
                      value={newActivity.scheduled_date}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#003366]"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Anteckningar
                    </label>
                    <textarea
                      value={newActivity.notes}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#003366]"
                      rows={2}
                      placeholder="Valfria anteckningar..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowAddActivity(false)}
                      className="px-3 py-1 text-xs text-[#003366] border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] transition-colors"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={handleAddActivity}
                      disabled={!newActivity.activity_id}
                      className="px-3 py-1 text-xs bg-[#003366] text-white rounded hover:bg-[#004080] transition-colors disabled:opacity-50"
                    >
                      Lägg till
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Activities List */}
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#003366] mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Laddar aktiviteter...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-6 bg-[#F9FAFB] rounded-lg">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Inga aktiviteter planerade</p>
                <p className="text-xs text-gray-400 mt-1">Lägg till aktiviteter för detta område</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map(activity => {
                  const IconComponent = activity.activity?.icon 
                    ? getIconComponent(activity.activity.icon)
                    : Info
                  
                  return (
                    <div key={activity.id} className="p-3 bg-[#F9FAFB] rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#003366] flex items-center justify-center mr-3">
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-[#003366]">
                                {activity.activity?.name || 'Okänd aktivitet'}
                              </h4>
                              
                              {activity.activity?.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {activity.activity.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                              <div className="flex">
                                <button
                                  onClick={() => handleUpdateActivityStatus(activity.id, 'completed')}
                                  className={`p-1 rounded-l border-y border-l border-gray-300 ${
                                    activity.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                  title="Markera som slutförd"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleUpdateActivityStatus(activity.id, 'in_progress')}
                                  className={`p-1 border-y border-gray-300 ${
                                    activity.status === 'in_progress' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                  }`}
                                  title="Markera som pågående"
                                >
                                  <Clock className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(activity.id)}
                                  className="p-1 rounded-r border-y border-r border-gray-300 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  title="Ta bort aktivitet"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                              {getStatusLabel(activity.status)}
                            </span>
                            
                            {activity.team && (
                              <span 
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: activity.team.color }}
                              >
                                <Users className="w-3 h-3 mr-1" />
                                {activity.team.name}
                              </span>
                            )}
                            
                            {activity.scheduled_date && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(activity.scheduled_date).toLocaleDateString('sv-SE')}
                              </span>
                            )}
                          </div>
                          
                          {activity.notes && (
                            <p className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] p-4 bg-[#F9FAFB]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  )
}