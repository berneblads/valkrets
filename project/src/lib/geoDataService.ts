import { supabase, Area, ElectionData } from './supabase'

// Kommun-kod dictionary från original kod
const kommunDictionary: Record<string, string> = {
  "1214": "Svalöv", "1230": "Staffanstorp", "1231": "Burlöv", "1233": "Vellinge", 
  "1256": "Östra Göinge", "1257": "Örkelljunga", "1260": "Bjuv", "1261": "Kävlinge", 
  "1262": "Lomma", "1263": "Svedala", "1264": "Skurup", "1265": "Sjöbo", 
  "1266": "Hörby", "1267": "Höör", "1270": "Tomelilla", "1272": "Bromölla", 
  "1273": "Osby", "1275": "Perstorp", "1276": "Klippan", "1277": "Åstorp", 
  "1278": "Båstad", "1280": "Malmö", "1281": "Lund", "1282": "Landskrona", 
  "1283": "Helsingborg", "1284": "Höganäs", "1285": "Eslöv", "1286": "Ystad", 
  "1287": "Trelleborg", "1290": "Kristianstad", "1291": "Simrishamn", 
  "1292": "Ängelholm", "1293": "Hässleholm"
}

export interface DistrictData {
  id?: string
  name: string
  municipality?: string
  municipalityCode?: string
  geojson: any
  electionResults?: {
    riksdag?: any
    kommun?: any
    region?: any
  }
  teamAssignment?: string
}

export interface MunicipalityData {
  id: string
  name: string
  code: string
  geojson: any
}

export class GeoDataService {
  private static instance: GeoDataService
  private municipalities: Map<string, MunicipalityData> = new Map()
  private districts: Map<string, DistrictData> = new Map()
  private electionResults: Map<string, any> = new Map()

  static getInstance(): GeoDataService {
    if (!GeoDataService.instance) {
      GeoDataService.instance = new GeoDataService()
    }
    return GeoDataService.instance
  }

  // Ladda kommuner från GitHub
  async loadMunicipalities(): Promise<MunicipalityData[]> {
    try {
      console.log('Laddar kommuner från GitHub...')
      const response = await fetch('https://raw.githubusercontent.com/berneblads/valkrets/main/swedish_municipalities.geojson')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format: missing features array')
      }

      const skaneMunicipalities = data.features.filter((m: any) => 
        m.properties && m.properties.lan_code === "12"
      )
      const municipalities: MunicipalityData[] = []

      skaneMunicipalities.forEach((m: any) => {
        if (!m.properties || !m.properties.id || !m.properties.kom_namn) {
          console.warn('Skipping municipality with missing properties:', m)
          return
        }

        const municipality: MunicipalityData = {
          id: m.properties.id,
          name: m.properties.kom_namn,
          code: m.properties.id,
          geojson: m
        }
        municipalities.push(municipality)
        this.municipalities.set(municipality.code, municipality)
      })

      console.log('✅ Kommuner laddade:', municipalities.length)
      return municipalities
    } catch (error) {
      console.error('❌ Fel vid laddning av kommuner:', error)
      throw new Error(`Failed to load municipalities: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Ladda valdistrikt från GitHub
  async loadDistricts(municipalityCode?: string): Promise<DistrictData[]> {
    try {
      console.log('Laddar valdistrikt från GitHub...')
      const response = await fetch('https://raw.githubusercontent.com/berneblads/valkrets/main/Valdistrikt%2C%202022.json')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON format: missing features array')
      }

      let filteredDistricts = data.features
      if (municipalityCode) {
        filteredDistricts = data.features.filter((d: any) => 
          d.properties && d.properties.Lkfv && d.properties.Lkfv.toString().startsWith(municipalityCode)
        )
      }

      const districts: DistrictData[] = []
      filteredDistricts.forEach((d: any) => {
        if (!d.properties || !d.properties.Vdnamn) {
          console.warn('Skipping district with missing properties:', d)
          return
        }

        const district: DistrictData = {
          name: d.properties.Vdnamn,
          municipality: kommunDictionary[municipalityCode || ''] || d.properties.kommun || 'Okänd',
          municipalityCode: municipalityCode,
          geojson: d
        }
        districts.push(district)
        this.districts.set(district.name, district)
      })

      console.log('✅ Valdistrikt laddade:', districts.length)
      return districts
    } catch (error) {
      console.error('❌ Fel vid laddning av valdistrikt:', error)
      throw new Error(`Failed to load districts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Ladda valresultat från GitHub
  async loadElectionResults(): Promise<{
    kommun: any[]
    region: any[]
    riksdag: any[]
  }> {
    try {
      console.log('🗳️ DEBUG: Startar laddning av valresultat från GitHub...')
      
      const fetchWithTimeout = async (url: string, timeout = 10000) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        try {
          const response = await fetch(url, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          return response
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      }

      console.log('🗳️ DEBUG: Hämtar valdata från URL:', 'https://raw.githubusercontent.com/berneblads/valkrets/main/Valresultat%20riksdag.json')
      
      const riksdagRes = await fetchWithTimeout('https://raw.githubusercontent.com/berneblads/valkrets/main/Valresultat%20riksdag.json', 15000)

      console.log('📊 DEBUG: Fetch response status:', riksdagRes.status)
      console.log('📊 DEBUG: Fetch response headers:', Object.fromEntries(riksdagRes.headers.entries()))

      const data = await riksdagRes.json()
      console.log('📊 DEBUG: Raw JSON data type:', typeof data)
      console.log('📊 DEBUG: Is array:', Array.isArray(data))
      console.log('📊 DEBUG: Data length:', Array.isArray(data) ? data.length : 'N/A')
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📊 DEBUG: First item keys:', Object.keys(data[0]))
        console.log('📊 DEBUG: First item sample:', {
          LKFV: data[0].LKFV,
          Valdistriktsnamn: data[0].Valdistriktsnamn,
          KD: data[0].KD,
          'Antal giltiga valsedlar': data[0]['Antal giltiga valsedlar']
        })
        
        // Test specific district lookup
        const testDistrict = data.find(item => item.LKFV === '12140101')
        console.log('📊 DEBUG: Test district lookup (12140101):', testDistrict)
      }

      const riksdagData = Array.isArray(data) ? data : []

      const results = {
        kommun: riksdagData,
        region: riksdagData,
        riksdag: riksdagData
      }

      console.log('✅ DEBUG: Valresultat laddade från GitHub:', {
        kommun: riksdagData.length,
        region: riksdagData.length,
        riksdag: riksdagData.length
      })
      
      return results
    } catch (error) {
      console.error('❌ DEBUG: Fel vid laddning av valresultat från GitHub:', error)
      return { kommun: [], region: [], riksdag: [] }
    }
  }

  // Kombinera distrikt med valresultat
  async combineDistrictsWithResults(districts: DistrictData[]): Promise<DistrictData[]> {
    if (!districts || districts.length === 0) {
      console.log('⚠️ LKFV DEBUG: Inga distrikt att kombinera med valresultat')
      return []
    }

    console.log('🔄 LKFV DEBUG: Kombinerar', districts.length, 'distrikt med valresultat...')
    const electionResults = await this.loadElectionResults()
    
    console.log('📊 LKFV DEBUG: Election results loaded:', {
      kommun: electionResults.kommun.length,
      region: electionResults.region.length,
      riksdag: electionResults.riksdag.length
    })
    
    // Debug: Visa exempel på LKFV-koder från valresultat
    if (electionResults.riksdag.length > 0) {
      console.log('📊 LKFV DEBUG: Första 5 LKFV-koder från valresultat:')
      electionResults.riksdag.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. LKFV: "${item.LKFV}" (${typeof item.LKFV}), Distrikt: "${item.Valdistriktsnamn}"`)
      })
    }
    
    // Debug: Visa exempel på LKFV-koder från distrikt
    console.log('🗺️ LKFV DEBUG: Första 5 LKFV-koder från distrikt:')
    districts.slice(0, 5).forEach((district, index) => {
      const code = district.geojson?.properties?.Lkfv
      console.log(`  ${index + 1}. LKFV: "${code}" (${typeof code}), Distrikt: "${district.name}"`)
    })
    
    return districts.map(district => {
      const code = district.geojson?.properties?.Lkfv?.toString()
      console.log(`🔍 LKFV DEBUG: Processing district: "${district.name}", LKFV code: "${code}"`)
      
      if (code) {
        // Testa olika matchningsstrategier
        console.log(`🔍 LKFV DEBUG: Söker matchning för kod "${code}" i ${electionResults.riksdag.length} valresultat...`)
        
        const kommunResult = electionResults.kommun.find(item => 
          item && item.LKFV && item.LKFV.toString().trim() === code.trim()
        )
        const regionResult = electionResults.region.find(item => 
          item && item.LKFV && item.LKFV.toString().trim() === code.trim()
        )
        const riksdagResult = electionResults.riksdag.find(item => 
          item && item.LKFV && item.LKFV.toString().trim() === code.trim()
        )

        // Testa även partiell matchning om exakt matchning misslyckas
        if (!riksdagResult) {
          console.log(`❌ LKFV DEBUG: Ingen exakt matchning för "${code}", testar partiell matchning...`)
          const partialMatches = electionResults.riksdag.filter(item => 
            item && item.LKFV && (
              item.LKFV.toString().includes(code) || 
              code.includes(item.LKFV.toString())
            )
          )
          console.log(`🔍 LKFV DEBUG: Partiella matchningar för "${code}":`, partialMatches.map(m => ({
            LKFV: m.LKFV,
            namn: m.Valdistriktsnamn
          })))
        }

        console.log(`🔍 LKFV DEBUG: Match results for "${district.name}" (LKFV: "${code}"):`, {
          kommun: !!kommunResult,
          region: !!regionResult,
          riksdag: !!riksdagResult,
          riksdagData: riksdagResult ? {
            LKFV: riksdagResult.LKFV,
            namn: riksdagResult.Valdistriktsnamn,
            KD: riksdagResult.KD,
            totalVotes: riksdagResult['Antal giltiga valsedlar'],
            availableKeys: Object.keys(riksdagResult).slice(0, 10)
          } : 'none'
        })

        if (riksdagResult) {
          district.electionResults = {
            kommun: riksdagResult, // Använd riksdagResult för alla tre
            region: riksdagResult,
            riksdag: riksdagResult
          }
          console.log(`✅ LKFV DEBUG: Election results assigned to district "${district.name}"`)
        } else {
          console.log(`❌ LKFV DEBUG: No election results found for district "${district.name}" (LKFV: "${code}")`)
          
          // Visa närliggande LKFV-koder för felsökning
          const similarCodes = electionResults.riksdag
            .filter(item => item && item.LKFV && Math.abs(parseInt(item.LKFV) - parseInt(code)) < 100)
            .slice(0, 3)
            .map(item => ({ LKFV: item.LKFV, namn: item.Valdistriktsnamn }))
          
          if (similarCodes.length > 0) {
            console.log(`🔍 LKFV DEBUG: Närliggande LKFV-koder:`, similarCodes)
          }
        }
      } else {
        console.log(`⚠️ LKFV DEBUG: No LKFV code found for district "${district.name}"`)
        console.log(`⚠️ LKFV DEBUG: District properties:`, district.geojson?.properties)
      }
      return district
    })
  }

  // Spara område till Supabase
  async saveAreaToSupabase(district: DistrictData): Promise<void> {
    try {
      if (!district.name || !district.geojson) {
        throw new Error('District name and geojson are required')
      }

      const { error } = await supabase
        .from('areas')
        .insert({
          name: district.name,
          municipality: district.municipality || '',
          electoral_district: district.municipality || '',
          geojson: district.geojson,
          status: 'unassigned'
        })

      if (error) throw error
      console.log('✅ Område sparat till Supabase:', district.name)
    } catch (error) {
      console.error('❌ Fel vid sparande till Supabase:', error)
      throw new Error(`Failed to save area: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Hämta områden från Supabase
  async getAreasFromSupabase(): Promise<Area[]> {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Fel vid hämtning från Supabase:', error)
      return []
    }
  }

  // Tilldela team till distrikt
  assignTeamToDistrict(districtName: string, team: string): void {
    if (!districtName || !team) {
      console.warn('District name and team are required for assignment')
      return
    }

    const district = this.districts.get(districtName)
    if (district) {
      district.teamAssignment = team
      this.districts.set(districtName, district)
      this.saveTeamAssignments()
    } else {
      console.warn(`District not found: ${districtName}`)
    }
  }

  // Spara team-tilldelningar i localStorage
  private saveTeamAssignments(): void {
    try {
      const assignments: Record<string, string> = {}
      this.districts.forEach((district, name) => {
        if (district.teamAssignment) {
          assignments[name] = district.teamAssignment
        }
      })
      localStorage.setItem('teamAssignments', JSON.stringify(assignments))
    } catch (error) {
      console.error('Failed to save team assignments to localStorage:', error)
    }
  }

  // Ladda team-tilldelningar från localStorage
  loadTeamAssignments(): void {
    try {
      const saved = localStorage.getItem('teamAssignments')
      if (saved) {
        const assignments = JSON.parse(saved)
        if (typeof assignments === 'object' && assignments !== null) {
          Object.entries(assignments).forEach(([districtName, team]) => {
            if (typeof districtName === 'string' && typeof team === 'string') {
              const district = this.districts.get(districtName)
              if (district) {
                district.teamAssignment = team
                this.districts.set(districtName, district)
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('Fel vid laddning av team-tilldelningar:', error)
    }
  }

  // Sortera distrikt efter partistyrka
  sortDistrictsByPartyStrength(party: string, order: 'highest' | 'lowest' = 'highest'): Array<{
    name: string
    votes: number
    percentage: number
    district: DistrictData
  }> {
    if (!party) {
      console.warn('Party parameter is required for sorting')
      return []
    }

    const results: Array<{
      name: string
      votes: number
      percentage: number
      district: DistrictData
    }> = []

    this.districts.forEach((district, name) => {
      const electionResult = district.electionResults?.riksdag
      if (electionResult && typeof electionResult === 'object' && electionResult[party] !== undefined) {
        const votes = Number(electionResult[party]) || 0
        const totalVotes = Number(electionResult['Antal giltiga valsedlar']) || 0
        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0

        console.log(`📊 Party ${party} in ${name}: ${votes} votes (${percentage.toFixed(1)}%) of ${totalVotes} total`)

        results.push({
          name,
          votes,
          percentage,
          district
        })
      }
    })

    results.sort((a, b) => 
      order === 'highest' ? b.votes - a.votes : a.votes - b.votes
    )

    return results
  }

  // Hämta alla partier
  getAllParties(): string[] {
    const parties = new Set<string>()
    this.districts.forEach(district => {
      if (district.electionResults?.riksdag && typeof district.electionResults.riksdag === 'object') {
        Object.keys(district.electionResults.riksdag).forEach(party => {
          if (party !== 'LKFV' && 
              party !== 'Antal giltiga valsedlar' && 
              party !== 'Antal röstberättigade' &&
              party !== 'Antal röstande' &&
              party !== 'Andel röstande' &&
              party !== 'Antal ogiltiga valsedlar' &&
              party !== 'varav blanka valsedlar' &&
              party !== 'varav utländska medborgare' &&
              party !== 'Kommunkod' &&
              party !== 'Kommunnamn' &&
              party !== 'Valkretskod' &&
              party !== 'Valkretsnamn' &&
              party !== 'Valdistriktskod' &&
              party !== 'Valdistriktsnamn' &&
              typeof party === 'string') {
            parties.add(party)
          }
        })
      }
    })
    return Array.from(parties).sort()
  }

  // Hämta alla kommuner
  getAllMunicipalities(): MunicipalityData[] {
    return Array.from(this.municipalities.values())
  }

  // Hämta alla distrikt
  getAllDistricts(): DistrictData[] {
    return Array.from(this.districts.values())
  }

  // Hämta distrikt för kommun
  getDistrictsForMunicipality(municipalityCode: string): DistrictData[] {
    if (!municipalityCode) {
      return []
    }
    
    return Array.from(this.districts.values()).filter(
      district => district.municipalityCode === municipalityCode
    )
  }
}

export const geoDataService = GeoDataService.getInstance()