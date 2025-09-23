import React, { useState } from 'react'
import { Settings, Database, Download, Upload, Info, Bug, RefreshCw, Wifi, WifiOff, Image } from 'lucide-react'
import { MapDiagnostics } from '../Map/MapDiagnostics'
import { AssetManager } from './AssetManager'
import { syncService } from '../../lib/supabase'

export function SettingsView() {
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [showAssetManager, setShowAssetManager] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>(null)

  React.useEffect(() => {
    // Get initial sync status
    const status = syncService.getConnectionStatus()
    setSyncStatus(status)

    // Update sync status every 5 seconds
    const interval = setInterval(() => {
      const newStatus = syncService.getConnectionStatus()
      setSyncStatus(newStatus)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleLoadFromGitHub = async () => {
    try {
      alert('Funktion för att ladda data från GitHub till Supabase kommer att implementeras')
    } catch (error) {
      console.error('Fel vid laddning från GitHub:', error)
      alert('Fel vid laddning av data')
    }
  }

  const handleExportData = () => {
    alert('Export-funktion kommer att implementeras')
  }

  const handleForceSync = async () => {
    try {
      setSyncing(true)
      console.log('🔄 Forcing GLOBAL data sync from Supabase...')
      
      // Force sync visits and areas
      await syncService.triggerSync()
      
      alert('Global synkronisering slutförd! Alla användare har nu samma data.')
      
    } catch (error) {
      console.error('❌ Fel vid GLOBAL synkronisering:', error)
      alert('Fel vid synkronisering av data')
    } finally {
      setSyncing(false)
    }
  }

  const handleClearCache = () => {
    try {
      localStorage.removeItem('teamAssignments')
      localStorage.removeItem('drawnObjects')
      localStorage.removeItem('houseVisits')
      sessionStorage.clear()
      alert('Cache rensad! Ladda om sidan för att se effekten.')
    } catch (error) {
      console.error('Fel vid rensning av cache:', error)
      alert('Kunde inte rensa cache')
    }
  }

  if (showDiagnostics) {
    return (
      <div>
        <div className="p-4 border-b border-[#E5E7EB]">
          <button
            onClick={() => setShowDiagnostics(false)}
            className="text-[#003366] hover:text-[#004080] text-sm"
          >
            ← Tillbaka till inställningar
          </button>
        </div>
        <MapDiagnostics />
      </div>
    )
  }

  if (showAssetManager) {
    return (
      <div>
        <div className="p-4 border-b border-[#E5E7EB]">
          <button
            onClick={() => setShowAssetManager(false)}
            className="text-[#003366] hover:text-[#004080] text-sm"
          >
            ← Tillbaka till inställningar
          </button>
        </div>
        <AssetManager />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003366] mb-2">Inställningar</h1>
        <p className="text-gray-600">Hantera appens konfiguration och data</p>
      </div>

      <div className="space-y-6">
        {/* System Information */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Systeminformation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-[#003366] mb-2">Version</h3>
              <p className="text-sm text-gray-600">KD-Kampanj v2.3.0 (Global Sync)</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#003366] mb-2">Databas</h3>
              <p className="text-sm text-gray-600">Supabase (Global Real-time sync)</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#003366] mb-2">Kartdata</h3>
              <p className="text-sm text-gray-600">OpenStreetMap + GitHub</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#003366] mb-2">Region</h3>
              <p className="text-sm text-gray-600">Skåne län</p>
            </div>
          </div>
        </div>

        {/* Global Sync Status */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
            {syncStatus?.connected ? (
              <Wifi className="w-5 h-5 mr-2 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 mr-2 text-red-600" />
            )}
            Global Sync Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${syncStatus?.connected ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`text-sm font-medium mb-2 ${syncStatus?.connected ? 'text-green-900' : 'text-red-900'}`}>
                Anslutningsstatus
              </h3>
              <p className={`text-sm ${syncStatus?.connected ? 'text-green-700' : 'text-red-700'}`}>
                {syncStatus?.connected ? '✅ Ansluten till global sync' : '❌ Ej ansluten'}
              </p>
              {syncStatus?.reconnectAttempts > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  Återanslutningsförsök: {syncStatus.reconnectAttempts}
                </p>
              )}
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-[#003366] mb-2">Aktiva kanaler</h3>
              <p className="text-sm text-blue-700">
                {syncStatus?.channelCount || 0} kanaler aktiva
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Synkroniserar husbesök och kampanjområden
              </p>
            </div>
          </div>
        </div>

        {/* Asset Management */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Tillgångshantering
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-[#003366]">Hantera logotyper och grafik</h3>
                <p className="text-sm text-blue-700">
                  Ladda upp och hantera KD:s logotyper, ikoner och grafiska element
                </p>
              </div>
              <button 
                onClick={() => setShowAssetManager(true)}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors flex items-center space-x-2"
              >
                <Image size={16} />
                <span>Öppna</span>
              </button>
            </div>
          </div>
        </div>

        {/* Synchronization */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            Global Datasynkronisering
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-[#003366]">Tvinga global synkronisering</h3>
                <p className="text-sm text-blue-700">
                  Hämta senaste data från Supabase och synkronisera ALLA användare
                </p>
              </div>
              <button 
                onClick={handleForceSync}
                disabled={syncing}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Synkroniserar...' : 'Global Sync'}</span>
              </button>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-green-900 mb-2">Global real-time synkronisering aktiv</h3>
              <p className="text-sm text-green-700">
                Ändringar synkroniseras automatiskt mellan ALLA enheter och användare via Supabase. 
                Data sparas både lokalt och i molnet för bästa prestanda.
              </p>
              <ul className="text-xs text-green-600 mt-2 space-y-1">
                <li>• Husbesök synkas i realtid mellan alla användare</li>
                <li>• Kampanjområden uppdateras automatiskt</li>
                <li>• Ändringar visas omedelbart på alla enheter</li>
                <li>• Automatisk återanslutning vid nätverksproblem</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Diagnostics */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
            <Bug className="w-5 h-5 mr-2" />
            Diagnostik och felsökning
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-[#003366]">Kartdiagnostik</h3>
                <p className="text-sm text-blue-700">Kontrollera kartfunktionalitet och dependencies</p>
              </div>
              <button 
                onClick={() => setShowDiagnostics(true)}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors flex items-center space-x-2"
              >
                <Bug size={16} />
                <span>Kör diagnostik</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Rensa cache</h3>
                <p className="text-sm text-yellow-700">Ta bort lokalt sparade data (backup finns i Supabase)</p>
              </div>
              <button 
                onClick={handleClearCache}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Rensa
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Datahantering
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-[#003366]">Ladda data från GitHub</h3>
                <p className="text-sm text-gray-600">Synkronisera kommuner, valdistrikt och valresultat</p>
              </div>
              <button 
                onClick={handleLoadFromGitHub}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors flex items-center space-x-2"
              >
                <Upload size={16} />
                <span>Ladda</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-[#003366]">Exportera all data</h3>
                <p className="text-sm text-gray-600">Ladda ner all kampanjdata som CSV</p>
              </div>
              <button 
                onClick={handleExportData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Exportera</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4">Datakällor</h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-[#003366]">Kommuner</h3>
              <p className="text-xs text-blue-700 break-all">
                https://raw.githubusercontent.com/berneblads/valkrets/main/swedish_municipalities.geojson
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-green-900">Valdistrikt</h3>
              <p className="text-xs text-green-700 break-all">
                https://raw.githubusercontent.com/berneblads/valkrets/main/Valdistrikt%2C%202022.json
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-medium text-purple-900">Valresultat</h3>
              <p className="text-xs text-purple-700">
                Kommunval.json, Regionval.json, Riksdagsval.json från GitHub
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-[#003366]">Kartunderlag</h3>
              <p className="text-xs text-gray-700">
                OpenStreetMap tiles (https://tile.openstreetmap.org)
              </p>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg">
              <h3 className="text-sm font-medium text-[#003366]">Databas & Global Real-time</h3>
              <p className="text-xs text-indigo-700">
                Supabase PostgreSQL med global real-time subscriptions för alla användare
              </p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-[#003366]">KD Grafisk Profil</h3>
              <p className="text-xs text-yellow-700">
                Kristdemokraternas officiella färger och logotyper enligt grafisk manual
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}