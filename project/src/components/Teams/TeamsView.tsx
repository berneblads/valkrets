import React, { useState, useEffect } from 'react'
import { 
  Users, 
  MapPin, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Archive,
  UserPlus,
  Settings,
  Search,
  Filter,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'
import { teamService, TeamWithDetails } from '../../lib/teamService'
import { TeamCreateModal } from './TeamCreateModal'
import { TeamEditModal } from './TeamEditModal'
import { TeamDetailsModal } from './TeamDetailsModal'

export function TeamsView() {
  const [teams, setTeams] = useState<TeamWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamWithDetails | null>(null)
  const [viewingTeam, setViewingTeam] = useState<TeamWithDetails | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<TeamWithDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeams()
    // Remove default teams on first load
    removeDefaultTeams()
  }, [])

  const removeDefaultTeams = async () => {
    try {
      await teamService.removeDefaultTeams()
    } catch (error) {
      console.error('Error removing default teams:', error)
    }
  }

  const loadTeams = async () => {
    try {
      setLoading(true)
      setError(null)
      const allTeams = await teamService.getAll()
      setTeams(allTeams)
    } catch (error) {
      console.error('Error loading teams:', error)
      setError(error instanceof Error ? error.message : 'Fel vid laddning av teams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (teamData: any) => {
    try {
      const newTeam = await teamService.create(teamData)
      if (newTeam) {
        await loadTeams() // Reload to get full details
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    }
  }

  const handleUpdateTeam = async (id: string, updates: any) => {
    try {
      const updatedTeam = await teamService.update(id, updates)
      if (updatedTeam) {
        await loadTeams()
        setEditingTeam(null)
      }
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    }
  }

  const handleDeleteTeam = async (team: TeamWithDetails) => {
    try {
      await teamService.delete(team.id)
      await loadTeams()
      setDeletingTeam(null)
    } catch (error) {
      console.error('Error deleting team:', error)
      alert(error instanceof Error ? error.message : 'Fel vid borttagning av team')
    }
  }

  const handleArchiveTeam = async (team: TeamWithDetails) => {
    try {
      await teamService.archive(team.id)
      await loadTeams()
    } catch (error) {
      console.error('Error archiving team:', error)
      alert(error instanceof Error ? error.message : 'Fel vid arkivering av team')
    }
  }

  const exportTeamData = () => {
    const data: string[] = ['Team,Beskrivning,Medlemmar,Områden,Status,Skapad']
    
    teams.forEach(team => {
      data.push(`"${team.name}","${team.description || ''}",${team.member_count || 0},${team.area_count || 0},"${team.status}","${new Date(team.created_at).toLocaleDateString('sv-SE')}"`);
    })

    const csvContent = data.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `teams-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = !searchTerm || 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || team.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const getTeamStats = () => {
    return {
      total: teams.length,
      active: teams.filter(t => t.status === 'active').length,
      totalMembers: teams.reduce((sum, t) => sum + (t.member_count || 0), 0),
      totalAreas: teams.reduce((sum, t) => sum + (t.area_count || 0), 0)
    }
  }

  const stats = getTeamStats()

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003366] mb-2">Team Management</h1>
        <p className="text-gray-600">Skapa och hantera kampanjteams dynamiskt</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-[#003366]" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Totalt Teams</p>
              <p className="text-2xl font-semibold text-[#003366]">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Aktiva Teams</p>
              <p className="text-2xl font-semibold text-[#003366]">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
          <div className="flex items-center">
            <UserPlus className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Totalt Medlemmar</p>
              <p className="text-2xl font-semibold text-[#003366]">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tilldelade Områden</p>
              <p className="text-2xl font-semibold text-[#003366]">{stats.totalAreas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search and Filters */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Sök teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="all">Alla status</option>
              <option value="active">Aktiva</option>
              <option value="inactive">Inaktiva</option>
            </select>

            <button
              onClick={exportTeamData}
              className="flex items-center space-x-2 px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportera</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Skapa Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {teams.length === 0 ? 'Inga teams skapade än' : 'Inga teams matchar filtren'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {teams.length === 0 
                ? 'Skapa ditt första team för att komma igång med kampanjorganisation.'
                : 'Prova att ändra sökkriterier eller filter för att se fler teams.'
              }
            </p>
            {teams.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa första team
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E7EB]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medlemmar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Områden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skapad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E7EB]">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: team.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-[#003366]">{team.name}</div>
                          {team.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {team.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserPlus className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{team.member_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{team.area_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        team.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {team.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(team.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setViewingTeam(team)}
                          className="text-[#003366] hover:text-[#004080] p-1 rounded transition-colors"
                          title="Visa detaljer"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTeam(team)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="Redigera"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchiveTeam(team)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors"
                          title="Arkivera"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTeam(team)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Ta bort"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <TeamCreateModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTeam}
        />
      )}

      {editingTeam && (
        <TeamEditModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={handleUpdateTeam}
        />
      )}

      {viewingTeam && (
        <TeamDetailsModal
          team={viewingTeam}
          onClose={() => setViewingTeam(null)}
          onEdit={() => {
            setEditingTeam(viewingTeam)
            setViewingTeam(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Bekräfta borttagning
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Är du säker på att du vill ta bort teamet "{deletingTeam.name}"? 
              Denna åtgärd kan inte ångras och alla tilldelade områden kommer att bli otilldelade.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingTeam(null)}
                className="px-4 py-2 text-gray-700 border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleDeleteTeam(deletingTeam)}
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