import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: string
}

export function MapDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    // Test 1: Leaflet bibliotek
    results.push({
      test: 'Leaflet bibliotek',
      status: 'loading',
      message: 'Kontrollerar Leaflet...'
    })
    setDiagnostics([...results])

    try {
      const L = await import('leaflet')
      if (L.default || L) {
        results[results.length - 1] = {
          test: 'Leaflet bibliotek',
          status: 'success',
          message: 'Leaflet är korrekt laddat'
        }
      } else {
        results[results.length - 1] = {
          test: 'Leaflet bibliotek',
          status: 'error',
          message: 'Leaflet kunde inte laddas'
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        test: 'Leaflet bibliotek',
        status: 'error',
        message: 'Fel vid laddning av Leaflet',
        details: error instanceof Error ? error.message : 'Okänt fel'
      }
    }
    setDiagnostics([...results])

    // Test 2: React-Leaflet
    results.push({
      test: 'React-Leaflet',
      status: 'loading',
      message: 'Kontrollerar React-Leaflet...'
    })
    setDiagnostics([...results])

    try {
      const RL = await import('react-leaflet')
      if (RL.MapContainer && RL.TileLayer && RL.GeoJSON) {
        results[results.length - 1] = {
          test: 'React-Leaflet',
          status: 'success',
          message: 'React-Leaflet komponenter är tillgängliga'
        }
      } else {
        results[results.length - 1] = {
          test: 'React-Leaflet',
          status: 'error',
          message: 'React-Leaflet komponenter saknas'
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        test: 'React-Leaflet',
        status: 'error',
        message: 'Fel vid laddning av React-Leaflet',
        details: error instanceof Error ? error.message : 'Okänt fel'
      }
    }
    setDiagnostics([...results])

    // Test 3: Leaflet CSS
    results.push({
      test: 'Leaflet CSS',
      status: 'loading',
      message: 'Kontrollerar Leaflet CSS...'
    })
    setDiagnostics([...results])

    const leafletCssLoaded = Array.from(document.styleSheets).some(sheet => {
      try {
        return sheet.href && sheet.href.includes('leaflet')
      } catch {
        return false
      }
    })

    if (leafletCssLoaded) {
      results[results.length - 1] = {
        test: 'Leaflet CSS',
        status: 'success',
        message: 'Leaflet CSS är laddat'
      }
    } else {
      results[results.length - 1] = {
        test: 'Leaflet CSS',
        status: 'warning',
        message: 'Leaflet CSS kanske inte är korrekt laddat'
      }
    }
    setDiagnostics([...results])

    // Test 4: Nätverksanslutning till OpenStreetMap
    results.push({
      test: 'OpenStreetMap tiles',
      status: 'loading',
      message: 'Testar anslutning till OpenStreetMap...'
    })
    setDiagnostics([...results])

    try {
      const response = await fetch('https://tile.openstreetmap.org/0/0/0.png', {
        method: 'HEAD',
        mode: 'no-cors'
      })
      results[results.length - 1] = {
        test: 'OpenStreetMap tiles',
        status: 'success',
        message: 'OpenStreetMap tiles är tillgängliga'
      }
    } catch (error) {
      results[results.length - 1] = {
        test: 'OpenStreetMap tiles',
        status: 'error',
        message: 'Kan inte nå OpenStreetMap tiles',
        details: 'Kontrollera internetanslutning eller brandväggsinställningar'
      }
    }
    setDiagnostics([...results])

    // Test 5: GitHub geodata
    results.push({
      test: 'GitHub geodata',
      status: 'loading',
      message: 'Testar anslutning till GitHub geodata...'
    })
    setDiagnostics([...results])

    try {
      const response = await fetch('https://raw.githubusercontent.com/berneblads/valkrets/main/swedish_municipalities.geojson', {
        method: 'HEAD'
      })
      if (response.ok) {
        results[results.length - 1] = {
          test: 'GitHub geodata',
          status: 'success',
          message: 'GitHub geodata är tillgänglig'
        }
      } else {
        results[results.length - 1] = {
          test: 'GitHub geodata',
          status: 'error',
          message: `GitHub geodata otillgänglig (${response.status})`
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        test: 'GitHub geodata',
        status: 'error',
        message: 'Kan inte nå GitHub geodata',
        details: error instanceof Error ? error.message : 'Okänt fel'
      }
    }
    setDiagnostics([...results])

    // Test 6: Supabase anslutning
    results.push({
      test: 'Supabase anslutning',
      status: 'loading',
      message: 'Testar Supabase anslutning...'
    })
    setDiagnostics([...results])

    try {
      const { supabase } = await import('../../lib/supabase')
      const { data, error } = await supabase.from('areas').select('count').limit(1)
      if (!error) {
        results[results.length - 1] = {
          test: 'Supabase anslutning',
          status: 'success',
          message: 'Supabase anslutning fungerar'
        }
      } else {
        results[results.length - 1] = {
          test: 'Supabase anslutning',
          status: 'error',
          message: 'Supabase anslutningsfel',
          details: error.message
        }
      }
    } catch (error) {
      results[results.length - 1] = {
        test: 'Supabase anslutning',
        status: 'error',
        message: 'Kan inte ansluta till Supabase',
        details: error instanceof Error ? error.message : 'Okänt fel'
      }
    }
    setDiagnostics([...results])

    // Test 7: LocalStorage
    results.push({
      test: 'LocalStorage',
      status: 'loading',
      message: 'Testar LocalStorage...'
    })
    setDiagnostics([...results])

    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      results[results.length - 1] = {
        test: 'LocalStorage',
        status: 'success',
        message: 'LocalStorage fungerar'
      }
    } catch (error) {
      results[results.length - 1] = {
        test: 'LocalStorage',
        status: 'error',
        message: 'LocalStorage är inte tillgängligt',
        details: 'Kontrollera webbläsarinställningar för cookies/lagring'
      }
    }
    setDiagnostics([...results])

    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'loading':
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kartdiagnostik</h1>
        <p className="text-gray-600">Kontrollerar kartfunktionalitet och dependencies</p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {diagnostics.filter(d => d.status === 'success').length} av {diagnostics.length} tester lyckades
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isRunning ? 'Kör tester...' : 'Kör om tester'}
        </button>
      </div>

      <div className="space-y-3">
        {diagnostics.map((diagnostic, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(diagnostic.status)}`}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{diagnostic.test}</h3>
                <p className="text-sm text-gray-600">{diagnostic.message}</p>
                {diagnostic.details && (
                  <p className="text-xs text-gray-500 mt-1">{diagnostic.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {diagnostics.length > 0 && !isRunning && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Rekommendationer:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {diagnostics.some(d => d.status === 'error' && d.test === 'Leaflet bibliotek') && (
              <li>• Kontrollera att Leaflet är korrekt installerat: npm install leaflet</li>
            )}
            {diagnostics.some(d => d.status === 'error' && d.test === 'React-Leaflet') && (
              <li>• Kontrollera att React-Leaflet är korrekt installerat: npm install react-leaflet</li>
            )}
            {diagnostics.some(d => d.status === 'warning' && d.test === 'Leaflet CSS') && (
              <li>• Lägg till Leaflet CSS i index.css eller main.tsx</li>
            )}
            {diagnostics.some(d => d.status === 'error' && d.test === 'OpenStreetMap tiles') && (
              <li>• Kontrollera internetanslutning och brandväggsinställningar</li>
            )}
            {diagnostics.some(d => d.status === 'error' && d.test === 'GitHub geodata') && (
              <li>• GitHub kan vara otillgängligt, försök igen senare</li>
            )}
            {diagnostics.some(d => d.status === 'error' && d.test === 'Supabase anslutning') && (
              <li>• Kontrollera Supabase konfiguration i .env filen</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}