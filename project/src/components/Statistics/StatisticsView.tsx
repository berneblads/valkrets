import React, { useState, useEffect } from 'react'
import { BarChart3, MapPin, Users, TrendingUp } from 'lucide-react'
import { geoDataService } from '../../lib/geoDataService'

export function StatisticsView() {
  const [stats, setStats] = useState({
    totalDistricts: 0,
    assignedTeams: 0,
    municipalities: 0,
    parties: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const municipalities = await geoDataService.loadMunicipalities()
      const allDistricts = geoDataService.getAllDistricts()
      const parties = geoDataService.getAllParties()
      
      const assignedTeams = allDistricts.filter(d => d.teamAssignment).length

      setStats({
        totalDistricts: allDistricts.length,
        assignedTeams,
        municipalities: municipalities.length,
        parties: parties.length
      })
    } catch (error) {
      console.error('Fel vid laddning av statistik:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar statistik...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Statistik</h1>
        <p className="text-gray-600">Översikt över kampanjdata för Skåne</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valdistrikt</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDistricts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tilldelade teams</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.assignedTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kommuner</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.municipalities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Partier</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.parties}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Kampanjöversikt
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Datakällor</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Kommundata från GitHub</li>
              <li>• Valdistriktsdata från GitHub</li>
              <li>• Valresultat från GitHub</li>
              <li>• Team-tilldelningar lokalt sparade</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Funktioner</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Interaktiv karta över Skåne</li>
              <li>• Team-tilldelning per valdistrikt</li>
              <li>• Partistyrkeanalys</li>
              <li>• Export av team-tilldelningar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}