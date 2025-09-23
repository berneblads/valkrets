import React, { useState, useEffect } from 'react'
import { X, Users, MapPin, Edit, UserPlus, Calendar, Settings } from 'lucide-react'
import { TeamWithDetails, teamService } from '../../lib/teamService'

interface TeamDetailsModalProps {
  team: TeamWithDetails
  onClose: () => void
  onEdit: () => void
}

export function TeamDetailsModal({ team, onClose, onEdit }: TeamDetailsModalProps) {
  const [teamDetails, setTeamDetails] = useState<TeamWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamDetails()
  }, [team.id])

  const loadTeamDetails = async () => {
    try {
      setLoading(true)
      const details = await teamService.getById(team.id)
      setTeamDetails(details)
    } catch (error) {
      console.error('Error loading team details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!teamDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="text-center py-12">
            <p className="text-gray-600">Kunde inte ladda teamdetaljer</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5E7EB] p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: teamDetails.color }}
              />
              <div>
                <h2 className="text-xl font-semibold text-[#003366]">{teamDetails.name}</h2>
                {teamDetails.description && (
                  <p className="text-gray-600 text-sm">{teamDetails.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-2 text-[#003366] hover:bg-[#F3F4F6] rounded-full transition-colors"
                title="Redigera team"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#F3F4F6] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Team Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <div className="flex items-center">
                <UserPlus className="w-6 h-6 text-[#003366] mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Medlemmar</p>
                  <p className="text-xl font-semibold text-[#003366]">
                    {teamDetails.member_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-[#003366] mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Tilldelade områden</p>
                  <p className="text-xl font-semibold text-[#003366]">
                    {teamDetails.area_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-[#003366] mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Skapad</p>
                  <p className="text-sm font-medium text-[#003366]">
                    {new Date(teamDetails.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Medlemmar ({teamDetails.members?.length || 0})
            </h3>
            
            {teamDetails.members && teamDetails.members.length > 0 ? (
              <div className="space-y-2">
                {teamDetails.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.user_id ? 'U' : 'G'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#003366]">
                          {member.user_id || 'Gästmedlem'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#F9FAFB] rounded-lg">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Inga medlemmar än</p>
                <p className="text-sm text-gray-500">Lägg till medlemmar för att komma igång</p>
              </div>
            )}
          </div>

          {/* Assigned Areas */}
          <div>
            <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Tilldelade områden ({teamDetails.areas?.length || 0})
            </h3>
            
            {teamDetails.areas && teamDetails.areas.length > 0 ? (
              <div className="space-y-2">
                {teamDetails.areas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-[#003366]" />
                      <div>
                        <p className="text-sm font-medium text-[#003366]">
                          Område {area.area_id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Tilldelad {new Date(area.assigned_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      area.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : area.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {area.status === 'assigned' ? 'Tilldelad' : 
                       area.status === 'in_progress' ? 'Pågår' : 'Klar'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#F9FAFB] rounded-lg">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Inga områden tilldelade än</p>
                <p className="text-sm text-gray-500">Tilldela kampanjområden till detta team</p>
              </div>
            )}
          </div>

          {/* Team Metadata */}
          {teamDetails.metadata && Object.keys(teamDetails.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Metadata
              </h3>
              <div className="bg-[#F9FAFB] rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(teamDetails.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-6 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#003366] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
            >
              Stäng
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Redigera team</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}