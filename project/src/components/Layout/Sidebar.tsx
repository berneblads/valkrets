import React from 'react'
import { X, Map, BarChart3, Settings, Users, Database, MapPin, FileText } from 'lucide-react'
import { DistrictStatistics } from '../Map/DistrictStatistics'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentView: string
  onViewChange: (view: string) => void
  // Map controls props
  municipalities?: any[]
  districts?: any[]
  selectedMunicipality?: string
  selectedDistrict?: string
  onMunicipalityChange?: (code: string) => void
  onDistrictChange?: (name: string) => void
  onTeamAssignment?: (districtName: string, team: string) => void
  selectedDistrictInfo?: any
  houseVisitsCount?: number
  mapInstance?: any
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  currentView, 
  onViewChange,
  municipalities = [],
  districts = [],
  selectedMunicipality = '',
  selectedDistrict = '',
  onMunicipalityChange = () => {},
  onDistrictChange = () => {},
  onTeamAssignment = () => {},
  selectedDistrictInfo = null,
  houseVisitsCount = 0,
  mapInstance = null
}: SidebarProps) {
  const menuItems = [
    { id: 'map', label: 'Karta', icon: Map },
    { 
      id: 'database', 
      label: 'Husbesök', 
      icon: Database,
      badge: houseVisitsCount > 0 ? houseVisitsCount : undefined
    },
    { id: 'kampanjomraden', label: 'Kampanjområden', icon: MapPin },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'campaign', label: 'Kampanjtyper', icon: FileText },
    { id: 'settings', label: 'Inställningar', icon: Settings },
  ]

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - Made thinner */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto border-r border-[#E5E7EB] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between p-3 border-b border-[#E5E7EB] lg:hidden">
          <h2 className="text-lg font-semibold text-[#003366]">Meny</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[#F3F4F6] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id)
                      onClose()
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors text-sm ${
                      currentView === item.id
                        ? 'bg-[#003366] text-white'
                        : 'text-[#003366] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-[#FFD700] text-[#003366] text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-medium">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Map Controls - Only show when on map view */}
        {currentView === 'map' && (
          <div className="border-t border-[#E5E7EB] p-3">
            <h3 className="text-sm font-semibold text-[#003366] mb-3">Kartkontroller</h3>
            
            {/* Municipality Selection */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Välj kommun:
              </label>
              <select
                value={selectedMunicipality}
                onChange={(e) => onMunicipalityChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] text-sm"
              >
                <option value="">-- Alla kommuner --</option>
                {municipalities.map(municipality => (
                  <option key={municipality.code} value={municipality.code}>
                    {municipality.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Selection */}
            {districts.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Välj valdistrikt:
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => onDistrictChange(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] text-sm"
                >
                  <option value="">-- Alla distrikt --</option>
                  {districts.map(district => (
                    <option key={district.name} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Address Search - Only show when on map view */}
        {currentView === 'map' && (
          <div className="border-t border-[#E5E7EB] p-3">
            <h3 className="text-sm font-semibold text-[#003366] mb-3">Valstatistik</h3>
            <DistrictStatistics selectedDistrict={selectedDistrictInfo} />
          </div>
        )}
      </div>
    </>
  )
}