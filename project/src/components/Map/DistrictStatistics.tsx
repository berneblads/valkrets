import React from 'react'
import { BarChart3, Users, TrendingUp, Award, MapPin } from 'lucide-react'
import { DistrictData } from '../../lib/geoDataService'

interface DistrictStatisticsProps {
  selectedDistrict: DistrictData | null
}

export function DistrictStatistics({ selectedDistrict }: DistrictStatisticsProps) {
  console.log('📊 LKFV DEBUG: DistrictStatistics rendered with:', {
    hasDistrict: !!selectedDistrict,
    districtName: selectedDistrict?.name,
    hasElectionResults: !!selectedDistrict?.electionResults,
    electionResultsKeys: selectedDistrict?.electionResults ? Object.keys(selectedDistrict.electionResults) : 'none',
    riksdagResultExists: !!selectedDistrict?.electionResults?.riksdag,
    riksdagLKFV: selectedDistrict?.electionResults?.riksdag?.LKFV,
    riksdagKD: selectedDistrict?.electionResults?.riksdag?.KD,
    riksdagTotal: selectedDistrict?.electionResults?.riksdag?.['Antal giltiga valsedlar']
  })

  if (!selectedDistrict) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-500 mb-1">Välj valdistrikt</h3>
          <p className="text-xs text-gray-400">Klicka på ett valdistrikt på kartan för att se statistik</p>
        </div>
      </div>
    )
  }

  const electionResults = selectedDistrict.electionResults

  // Helper function to format party results
  const formatPartyResults = (results: any) => {
    if (!results || typeof results !== 'object') return []
    
    console.log('📊 LKFV DEBUG: Formatting party results for district:', selectedDistrict?.name)
    console.log('📊 LKFV DEBUG: Raw results object type:', typeof results)
    console.log('📊 LKFV DEBUG: Available keys:', Object.keys(results))
    console.log('📊 LKFV DEBUG: KD votes (raw):', results?.KD, '(type:', typeof results?.KD, ')')
    console.log('📊 LKFV DEBUG: Total valid votes (raw):', results?.['Antal giltiga valsedlar'], '(type:', typeof results?.['Antal giltiga valsedlar'], ')')
    
    const parties = Object.entries(results)
      .filter(([key, value]) => 
        key !== 'LKFV' && 
        key !== 'Kommunkod' &&
        key !== 'Kommunnamn' &&
        key !== 'Valkretskod' &&
        key !== 'Valkretsnamn' &&
        key !== 'Valdistriktskod' &&
        key !== 'Valdistriktsnamn' &&
        key !== 'Antal röstberättigade' &&
        key !== 'varav utländska medborgare' &&
        key !== 'Antal röstande' &&
        key !== 'Andel röstande' &&
        key !== 'Antal ogiltiga valsedlar' &&
        key !== 'varav blanka valsedlar' &&
        key !== 'Antal giltiga valsedlar' &&
        key !== 'Andel röstande' &&
        key !== 'Antal röstande' &&
        key !== 'varav utländska medborgare' &&
        // Ändra från typeof value === 'number' till att hantera strängar också
        (typeof value === 'number' || typeof value === 'string') && 
        !isNaN(Number(value)) &&
        Number(value) > 0
      )
      .map(([party, votes]) => ({
        party,
        votes: Number(votes),
        percentage: results['Antal giltiga valsedlar'] ? ((Number(votes) / Number(results['Antal giltiga valsedlar'])) * 100) : 0
      }))
      .sort((a, b) => b.votes - a.votes)
    
    console.log('📊 LKFV DEBUG: Filtered and formatted parties:', parties)
    console.log('📊 LKFV DEBUG: Number of parties found:', parties.length)
    
    // Specifik KD-kontroll
    const kdResult = parties.find(p => p.party === 'KD')
    if (kdResult) {
      console.log('✅ LKFV DEBUG: KD found with', kdResult.votes, 'votes (', kdResult.percentage.toFixed(1), '%)')
    } else {
      console.log('❌ LKFV DEBUG: KD not found in party results')
      console.log('📊 LKFV DEBUG: Raw KD value from results:', results?.KD, 'converted:', Number(results?.KD))
    }
    
    return parties
  }

  // Get party results for each election type
  const riksdagResults = formatPartyResults(electionResults?.riksdag)
  const kommunResults = formatPartyResults(electionResults?.kommun)
  const regionResults = formatPartyResults(electionResults?.region)

  // Get total voters for context
  const getTotalVoters = (results: any) => {
    const total = results?.['Antal giltiga valsedlar'] ? Number(results['Antal giltiga valsedlar']) : 0
    console.log('📊 DEBUG: Total voters calculation:', {
      total,
      rawValue: results?.['Antal giltiga valsedlar'],
      hasResults: !!results,
      resultType: typeof results
    })
    return total
  }

  const riksdagTotal = getTotalVoters(electionResults?.riksdag)
  const kommunTotal = getTotalVoters(electionResults?.kommun)
  const regionTotal = getTotalVoters(electionResults?.region)

  // Helper to get party color (simplified for now)
  const getPartyColor = (party: string) => {
    const colors: Record<string, string> = {
      'S': '#E53E3E',     // Socialdemokraterna - röd
      'M': '#3182CE',     // Moderaterna - blå
      'SD': '#F6E05E',    // Sverigedemokraterna - gul
      'C': '#38A169',     // Centerpartiet - grön
      'V': '#E53E3E',     // Vänsterpartiet - röd
      'KD': '#003366',    // Kristdemokraterna - KD blå
      'L': '#3182CE',     // Liberalerna - blå
      'MP': '#38A169',    // Miljöpartiet - grön
      'NYD': '#805AD5',   // Nydemokraterna - lila
    }
    return colors[party] || '#718096' // Default gray
  }

  const renderElectionSection = (
    title: string, 
    results: any[], 
    total: number, 
    icon: React.ReactNode
  ) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
          {total.toLocaleString('sv-SE')} röster
        </span>
      </div>
      
      {results.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">Ingen data tillgänglig</p>
      ) : (
        <div className="space-y-2">
          {results.slice(0, 6).map((result, index) => (
            <div key={result.party} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getPartyColor(result.party) }}
                />
                <span className="text-xs font-medium text-gray-700 truncate">
                  {result.party}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-900">
                    {result.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {result.votes.toLocaleString('sv-SE')}
                  </div>
                </div>
                <div className="w-12 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(result.percentage, 100)}%`,
                      backgroundColor: getPartyColor(result.party)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {results.length > 6 && (
            <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
              +{results.length - 6} fler partier
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* District Header */}
      <div className="bg-gradient-to-r from-[#003366] to-[#004080] rounded-xl p-4 text-white">
        <div className="flex items-center space-x-2 mb-2">
          <Award className="w-5 h-5 text-[#FFD700]" />
          <h2 className="text-sm font-bold">Valstatistik</h2>
        </div>
        <h3 className="text-lg font-bold mb-1">{selectedDistrict.name}</h3>
        <p className="text-xs text-blue-100">
          {selectedDistrict.municipality} • Valdistrikt
        </p>
      </div>

      {/* Election Results */}
      <div className="space-y-3">
        {renderElectionSection(
          'Riksdagsval', 
          riksdagResults, 
          riksdagTotal,
          <BarChart3 className="w-4 h-4 text-[#003366]" />
        )}
        
        {renderElectionSection(
          'Kommunval', 
          kommunResults, 
          kommunTotal,
          <Users className="w-4 h-4 text-[#003366]" />
        )}
        
        {renderElectionSection(
          'Regionval', 
          regionResults, 
          regionTotal,
          <TrendingUp className="w-4 h-4 text-[#003366]" />
        )}
      </div>

      {/* Summary Stats */}
      {(riksdagTotal > 0 || kommunTotal > 0 || regionTotal > 0) && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Sammanfattning
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {riksdagTotal > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Riksdag:</span>
                <span className="font-medium">{riksdagTotal.toLocaleString('sv-SE')} röster</span>
              </div>
            )}
            {kommunTotal > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Kommun:</span>
                <span className="font-medium">{kommunTotal.toLocaleString('sv-SE')} röster</span>
              </div>
            )}
            {regionTotal > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Region:</span>
                <span className="font-medium">{regionTotal.toLocaleString('sv-SE')} röster</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}