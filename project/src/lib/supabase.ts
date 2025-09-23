import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// More robust environment variable checking
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Enhanced connection testing function
const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...')
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('areas')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error)
      return false
    }
    
    console.log('✅ Supabase connection test successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection test error:', error)
    return false
  }
}

// Initialize auth session check with connection testing
const initializeAuth = async () => {
  try {
    // First test the connection
    const connectionOk = await testSupabaseConnection()
    if (!connectionOk) {
      console.warn('⚠️ Supabase connection issues detected')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      console.log('✅ Existing session found')
    } else {
      console.log('ℹ️ No active session - using anonymous access via RLS policies')
    }
  } catch (error) {
    console.warn('Auth initialization failed:', error)
  }
}

// Initialize auth when the module loads
initializeAuth()

// Database types based on the schema
export interface Area {
  id: string
  name: string
  municipality: string
  electoral_district: string
  geojson: any
  assigned_to?: string
  status: 'unassigned' | 'assigned' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  user_id?: string
  version: number
  last_modified_by?: string
  sync_status: 'synced' | 'pending' | 'conflict'
}

export interface Visit {
  id: string
  area_id?: string
  user_id?: string
  latitude: number
  longitude: number
  visit_type: 'area_visit' | 'household_contact'
  notes?: string
  campaign_materials?: any
  created_at: string
  version: number
  last_modified_by?: string
  sync_status: 'synced' | 'pending' | 'conflict'
  door_knock_result?: 'positiv' | 'negativ' | 'ville_inte_prata' | 'boende_öppnade_inte'
  address?: string
  full_address?: {
    street?: string
    house_number?: string
    city?: string
    postal_code?: string
    county?: string
  }
}

export interface ElectionData {
  id: string
  electoral_district_code: string
  municipality: string
  total_voters: number
  turnout_percentage: number
  party_results: Record<string, number>
  year: number
  created_at: string
}

export interface Profile {
  id: string
  name?: string
  email?: string
  role: 'admin' | 'executor'
  created_at: string
  updated_at: string
}

export interface MapFile {
  id: string
  file_name: string
  file_type: 'municipalities' | 'districts' | 'election_data'
  storage_path: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  upload_status: 'uploaded' | 'processing' | 'processed' | 'error'
  metadata?: any
  created_at: string
  updated_at: string
}

// Enhanced error handling utility
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase error ${operation}:`, error)
  
  if (error?.message?.includes('Failed to fetch')) {
    console.error('❌ Network connectivity issue detected')
    console.error('Possible causes:')
    console.error('1. Internet connection problems')
    console.error('2. Supabase service unavailable')
    console.error('3. Incorrect Supabase URL or API key')
    console.error('4. Firewall blocking requests')
    
    // Try to provide more specific guidance
    if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      console.error('⚠️ Using localhost URL - ensure Supabase is running locally')
    }
  }
  
  return error
}

// CRUD functions for visits (house visits) with enhanced error handling
export const visitService = {
  // Get all visits
  async getAll(): Promise<Visit[]> {
    try {
      console.log('🔍 Fetching all visits...')
      
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        handleSupabaseError(error, 'fetching visits')
        return []
      }
      
      console.log(`✅ Successfully fetched ${data?.length || 0} visits`)
      return data || []
    } catch (error) {
      console.error('Error fetching visits:', error)
      handleSupabaseError(error, 'fetching visits')
      return []
    }
  },

  // Create a new visit
  async create(visitData: {
    area_id?: string
    latitude: number
    longitude: number
    visit_type: 'area_visit' | 'household_contact'
    notes?: string
    campaign_materials?: any
    door_knock_result?: 'positiv' | 'negativ' | 'ville_inte_prata' | 'boende_öppnade_inte'
    address?: string
    full_address?: {
      street?: string
      house_number?: string
      city?: string
      postal_code?: string
      county?: string
    }
  }): Promise<Visit | null> {
    try {
      const insertData = {
        area_id: visitData.area_id || null,
        latitude: visitData.latitude,
        longitude: visitData.longitude,
        visit_type: visitData.visit_type,
        notes: visitData.notes || null,
        campaign_materials: visitData.campaign_materials || null,
        door_knock_result: visitData.door_knock_result || null,
        address: visitData.address || null,
        full_address: visitData.full_address || null
      }

      console.log('Creating visit with data:', insertData)

      const { data, error } = await supabase
        .from('visits')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'creating visit')
        return null
      }
      
      console.log('Visit created successfully:', data)
      return data
    } catch (error) {
      console.error('Error creating visit:', error)
      handleSupabaseError(error, 'creating visit')
      return null
    }
  },

  // Update a visit
  async update(id: string, updates: Partial<Visit>): Promise<Visit | null> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) {
        handleSupabaseError(error, 'updating visit')
        return null
      }
      return data
    } catch (error) {
      console.error('Error updating visit:', error)
      handleSupabaseError(error, 'updating visit')
      return null
    }
  },

  // Delete a visit
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', id)

      if (error) {
        handleSupabaseError(error, 'deleting visit')
        return false
      }
      return true
    } catch (error) {
      console.error('Error deleting visit:', error)
      handleSupabaseError(error, 'deleting visit')
      return false
    }
  }
}

// CRUD functions for areas (drawn objects) with enhanced error handling
export const areaService = {
  // Get all areas
  async getAll(): Promise<Area[]> {
    try {
      console.log('🔍 Fetching all areas...')
      
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        handleSupabaseError(error, 'fetching areas')
        return []
      }
      
      console.log(`✅ Successfully fetched ${data?.length || 0} areas`)
      return data || []
    } catch (error) {
      console.error('Error fetching areas:', error)
      handleSupabaseError(error, 'fetching areas')
      return []
    }
  },

  // Create a new area
  async create(areaData: {
    name: string
    municipality: string
    electoral_district: string
    geojson: any
    status?: 'unassigned' | 'assigned' | 'in_progress' | 'completed'
    assigned_to?: string
  }): Promise<Area | null> {
    try {
      const { data, error } = await supabase
        .from('areas')
        .insert({
          name: areaData.name,
          municipality: areaData.municipality,
          electoral_district: areaData.electoral_district,
          geojson: areaData.geojson,
          status: areaData.status || 'unassigned',
          assigned_to: areaData.assigned_to
        })
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'creating area')
        return null
      }
      return data
    } catch (error) {
      console.error('Error creating area:', error)
      handleSupabaseError(error, 'creating area')
      return null
    }
  },

  // Update an area
  async update(id: string, updates: Partial<Area>): Promise<Area | null> {
    try {
      const { data, error } = await supabase
        .from('areas')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) {
        handleSupabaseError(error, 'updating area')
        return null
      }
      return data
    } catch (error) {
      console.error('Error updating area:', error)
      handleSupabaseError(error, 'updating area')
      return null
    }
  },

  // Delete an area
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', id)

      if (error) {
        handleSupabaseError(error, 'deleting area')
        return false
      }
      return true
    } catch (error) {
      console.error('Error deleting area:', error)
      handleSupabaseError(error, 'deleting area')
      return false
    }
  }
}

// Enhanced real-time synchronization service with better error handling and team support
export const syncService = {
  private: {
    channels: new Map<string, any>(),
    isInitialized: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    globalEventBus: new EventTarget(),
    connectionHealthy: true
  },

  // Initialize real-time subscriptions with enhanced error handling and team support
  initialize() {
    try {
      if (this.private.isInitialized) {
        console.log('🔄 Sync service already initialized')
        return this.getCleanupFunction()
      }

      console.log('🔄 Initializing GLOBAL real-time sync for ALL users...')
      
      // Subscribe to visits changes with GLOBAL broadcasting
      const visitsChannel = supabase
        .channel('global_visits_sync', {
          config: {
            broadcast: { self: true },
            presence: { key: 'visits' }
          }
        })
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'visits' },
          (payload) => {
            console.log('📡 GLOBAL Visit change received:', payload.eventType, payload.new?.id || payload.old?.id)
            
            // Broadcast to ALL users via multiple channels
            this.broadcastToAllUsers('visitChange', payload)
          }
        )
        .on('broadcast', 
          { event: 'visit_sync' },
          (payload) => {
            console.log('📡 Broadcast visit sync received:', payload)
            this.broadcastToAllUsers('visitChange', payload.data)
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Global visits channel status:', status)
          if (err) {
            console.error('📡 Global visits channel error:', err)
            this.private.connectionHealthy = false
            this.handleReconnection('visits')
          }
          if (status === 'SUBSCRIBED') {
            this.private.reconnectAttempts = 0
            this.private.connectionHealthy = true
            console.log('✅ Global visits sync ACTIVE for ALL users')
          }
        })

      // Subscribe to areas changes with GLOBAL broadcasting
      const areasChannel = supabase
        .channel('global_areas_sync', {
          config: {
            broadcast: { self: true },
            presence: { key: 'areas' }
          }
        })
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'areas' },
          (payload) => {
            console.log('📡 GLOBAL Area change received:', payload.eventType, payload.new?.id || payload.old?.id)
            
            // Broadcast to ALL users via multiple channels
            this.broadcastToAllUsers('areaChange', payload)
          }
        )
        .on('broadcast',
          { event: 'area_sync' },
          (payload) => {
            console.log('📡 Broadcast area sync received:', payload)
            this.broadcastToAllUsers('areaChange', payload.data)
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Global areas channel status:', status)
          if (err) {
            console.error('📡 Global areas channel error:', err)
            this.private.connectionHealthy = false
            this.handleReconnection('areas')
          }
          if (status === 'SUBSCRIBED') {
            this.private.reconnectAttempts = 0
            this.private.connectionHealthy = true
            console.log('✅ Global areas sync ACTIVE for ALL users')
          }
        })

      // Subscribe to teams changes with GLOBAL broadcasting
      const teamsChannel = supabase
        .channel('global_teams_sync', {
          config: {
            broadcast: { self: true },
            presence: { key: 'teams' }
          }
        })
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'teams' },
          (payload) => {
            console.log('📡 GLOBAL Team change received:', payload.eventType, payload.new?.id || payload.old?.id)
            
            // Broadcast to ALL users via multiple channels
            this.broadcastToAllUsers('teamChange', payload)
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'team_areas' },
          (payload) => {
            console.log('📡 GLOBAL Team area assignment change received:', payload.eventType)
            
            // Broadcast to ALL users via multiple channels
            this.broadcastToAllUsers('teamAreaChange', payload)
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Global teams channel status:', status)
          if (err) {
            console.error('📡 Global teams channel error:', err)
            this.private.connectionHealthy = false
            this.handleReconnection('teams')
          }
          if (status === 'SUBSCRIBED') {
            this.private.reconnectAttempts = 0
            this.private.connectionHealthy = true
            console.log('✅ Global teams sync ACTIVE for ALL users')
          }
        })

      // Store channels for cleanup
      this.private.channels.set('visits', visitsChannel)
      this.private.channels.set('areas', areasChannel)
      this.private.channels.set('teams', teamsChannel)
      this.private.isInitialized = true

      // Set up periodic sync check to ensure all users stay in sync
      this.setupPeriodicSync()

      console.log('✅ GLOBAL real-time sync initialized for ALL users')

      return this.getCleanupFunction()
    } catch (error) {
      console.error('Error initializing GLOBAL real-time sync:', error)
      this.private.connectionHealthy = false
      return () => {}
    }
  },

  // Broadcast changes to ALL users via multiple channels
  broadcastToAllUsers(eventType: string, payload: any) {
    try {
      // Only proceed if connection is healthy
      if (!this.private.connectionHealthy) {
        console.warn('⚠️ Connection unhealthy, skipping broadcast')
        return
      }

      // 1. Dispatch to local window events (for same-tab updates)
      window.dispatchEvent(new CustomEvent(eventType, { 
        detail: payload,
        bubbles: true 
      }))

      // 2. Broadcast via Supabase channels (for cross-user updates)
      if (eventType === 'visitChange') {
        const channel = this.private.channels.get('visits')
        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'visit_sync',
            data: payload
          })
        }
      } else if (eventType === 'areaChange') {
        const channel = this.private.channels.get('areas')
        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'area_sync',
            data: payload
          })
        }
      } else if (eventType === 'teamChange' || eventType === 'teamAreaChange') {
        const channel = this.private.channels.get('teams')
        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'team_sync',
            data: payload
          })
        }
      }

      // 3. Store in localStorage for persistence across sessions
      const syncData = {
        eventType,
        payload,
        timestamp: Date.now()
      }
      localStorage.setItem(`lastSync_${eventType}`, JSON.stringify(syncData))

      // 4. Dispatch to global event bus
      this.private.globalEventBus.dispatchEvent(new CustomEvent(eventType, {
        detail: payload
      }))

      console.log(`📡 Broadcasted ${eventType} to ALL users via multiple channels`)
    } catch (error) {
      console.error(`Error broadcasting ${eventType}:`, error)
      this.private.connectionHealthy = false
    }
  },

  // Set up periodic sync with better error handling
  setupPeriodicSync() {
    // Check for sync every 30 seconds
    setInterval(async () => {
      try {
        // Skip if connection is unhealthy
        if (!this.private.connectionHealthy) {
          console.log('⚠️ Skipping periodic sync - connection unhealthy')
          return
        }

        console.log('🔄 Performing periodic sync check...')
        
        // Force sync data from server
        const [visits, areas] = await Promise.all([
          this.forceSyncVisits(),
          this.forceSyncAreas()
        ])

        // Broadcast the latest data to ensure all users are in sync
        window.dispatchEvent(new CustomEvent('periodicSync', { 
          detail: { visits, areas },
          bubbles: true 
        }))

        console.log('✅ Periodic sync completed')
        this.private.connectionHealthy = true
      } catch (error) {
        console.error('❌ Periodic sync failed:', error)
        this.private.connectionHealthy = false
      }
    }, 30000) // 30 seconds
  },

  // Handle reconnection logic with better error handling
  handleReconnection(channelType: string) {
    if (this.private.reconnectAttempts >= this.private.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${channelType}`)
      this.private.connectionHealthy = false
      return
    }

    this.private.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.private.reconnectAttempts), 30000)

    console.log(`🔄 Attempting to reconnect ${channelType} channel (attempt ${this.private.reconnectAttempts}/${this.private.maxReconnectAttempts}) in ${delay}ms`)

    setTimeout(() => {
      try {
        const existingChannel = this.private.channels.get(channelType)
        if (existingChannel) {
          existingChannel.unsubscribe()
        }

        this.private.isInitialized = false
        this.initialize()
      } catch (error) {
        console.error(`Error during ${channelType} reconnection:`, error)
        this.private.connectionHealthy = false
      }
    }, delay)
  },

  // Get cleanup function
  getCleanupFunction() {
    return () => {
      try {
        console.log('🧹 Cleaning up GLOBAL real-time sync...')
        
        this.private.channels.forEach((channel, name) => {
          try {
            channel.unsubscribe()
            console.log(`✅ Unsubscribed from ${name} channel`)
          } catch (error) {
            console.error(`Error unsubscribing from ${name} channel:`, error)
          }
        })
        
        this.private.channels.clear()
        this.private.isInitialized = false
        this.private.reconnectAttempts = 0
        this.private.connectionHealthy = true
        
        console.log('✅ GLOBAL real-time sync cleanup completed')
      } catch (error) {
        console.error('Error during GLOBAL real-time sync cleanup:', error)
      }
    }
  },

  // Force sync from server with better error handling
  async forceSyncVisits(): Promise<Visit[]> {
    try {
      console.log('🔄 Force syncing visits from server...')
      return await visitService.getAll()
    } catch (error) {
      console.error('❌ Force sync visits failed:', error)
      this.private.connectionHealthy = false
      return []
    }
  },

  async forceSyncAreas(): Promise<Area[]> {
    try {
      console.log('🔄 Force syncing areas from server...')
      return await areaService.getAll()
    } catch (error) {
      console.error('❌ Force sync areas failed:', error)
      this.private.connectionHealthy = false
      return []
    }
  },

  // Manual trigger for testing and ensuring sync
  async triggerSync() {
    try {
      console.log('🔄 Manually triggering GLOBAL sync...')
      
      const [visits, areas] = await Promise.all([
        this.forceSyncVisits(),
        this.forceSyncAreas()
      ])

      // Broadcast to ALL users
      this.broadcastToAllUsers('manualSync', { visits, areas })

      console.log('✅ Manual GLOBAL sync completed')
      this.private.connectionHealthy = true
      return { visits, areas }
    } catch (error) {
      console.error('❌ Manual GLOBAL sync failed:', error)
      this.private.connectionHealthy = false
      throw error
    }
  },

  // Check connection status
  getConnectionStatus() {
    const channels = Array.from(this.private.channels.values())
    const connected = channels.every(channel => channel.state === 'joined')
    
    return {
      connected,
      channelCount: channels.length,
      reconnectAttempts: this.private.reconnectAttempts,
      isInitialized: this.private.isInitialized,
      connectionHealthy: this.private.connectionHealthy
    }
  },

  // Listen to global events
  addEventListener(eventType: string, callback: (event: CustomEvent) => void) {
    this.private.globalEventBus.addEventListener(eventType, callback as EventListener)
  },

  removeEventListener(eventType: string, callback: (event: CustomEvent) => void) {
    this.private.globalEventBus.removeEventListener(eventType, callback as EventListener)
  }
}