import { supabase } from './supabase'

export interface CampaignType {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  is_active: boolean
  sort_order: number
  metadata?: any
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CampaignActivity {
  id: string
  name: string
  description?: string
  icon?: string
  is_active: boolean
  sort_order: number
  metadata?: any
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AreaActivity {
  id: string
  area_id: string
  activity_id: string
  team_id?: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date?: string
  completed_date?: string
  notes?: string
  metadata?: any
  created_by?: string
  created_at: string
  updated_at: string
  activity?: CampaignActivity
  team?: { name: string; color: string }
}

// Enhanced error handling utility
const handleCampaignError = (error: any, operation: string) => {
  console.error(`Campaign service error ${operation}:`, error)
  
  if (error?.message?.includes('duplicate key')) {
    throw new Error('En post med detta namn finns redan')
  }
  
  if (error?.message?.includes('foreign key')) {
    throw new Error('Kan inte ta bort denna post på grund av beroenden')
  }
  
  throw new Error(`Fel vid ${operation}: ${error?.message || 'Okänt fel'}`)
}

export const campaignService = {
  // Campaign Types
  async getAllCampaignTypes(): Promise<CampaignType[]> {
    try {
      console.log('🔍 Fetching all campaign types...')
      
      const { data, error } = await supabase
        .from('campaign_types')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        handleCampaignError(error, 'fetching campaign types')
      }
      
      console.log(`✅ Successfully fetched ${data?.length || 0} campaign types`)
      return data || []
    } catch (error) {
      console.error('Error fetching campaign types:', error)
      throw error
    }
  },

  async getActiveCampaignTypes(): Promise<CampaignType[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        handleCampaignError(error, 'fetching active campaign types')
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching active campaign types:', error)
      throw error
    }
  },

  async createCampaignType(typeData: {
    name: string
    description?: string
    color?: string
    icon?: string
    is_active?: boolean
    sort_order?: number
    metadata?: any
  }): Promise<CampaignType | null> {
    try {
      console.log('🔄 Creating campaign type:', typeData.name)

      // Validate name
      if (!typeData.name?.trim()) {
        throw new Error('Namn krävs')
      }

      const { data, error } = await supabase
        .from('campaign_types')
        .insert({
          name: typeData.name.trim(),
          description: typeData.description?.trim(),
          color: typeData.color || '#003366',
          icon: typeData.icon,
          is_active: typeData.is_active !== undefined ? typeData.is_active : true,
          sort_order: typeData.sort_order || 0,
          metadata: typeData.metadata || {}
        })
        .select()
        .single()

      if (error) {
        handleCampaignError(error, 'creating campaign type')
      }
      
      console.log('✅ Campaign type created successfully:', data?.name)
      return data
    } catch (error) {
      console.error('Error creating campaign type:', error)
      throw error
    }
  },

  async updateCampaignType(id: string, updates: Partial<CampaignType>): Promise<CampaignType | null> {
    try {
      console.log('🔄 Updating campaign type:', id)

      // Validate updates
      if (updates.name !== undefined && !updates.name?.trim()) {
        throw new Error('Namn krävs')
      }

      const { data, error } = await supabase
        .from('campaign_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        handleCampaignError(error, 'updating campaign type')
      }
      
      console.log('✅ Campaign type updated successfully:', data?.name)
      return data
    } catch (error) {
      console.error('Error updating campaign type:', error)
      throw error
    }
  },

  async deleteCampaignType(id: string): Promise<boolean> {
    try {
      console.log('🔄 Deleting campaign type:', id)

      const { error } = await supabase
        .from('campaign_types')
        .delete()
        .eq('id', id)

      if (error) {
        handleCampaignError(error, 'deleting campaign type')
      }
      
      console.log('✅ Campaign type deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting campaign type:', error)
      throw error
    }
  },

  // Campaign Activities
  async getAllCampaignActivities(): Promise<CampaignActivity[]> {
    try {
      console.log('🔍 Fetching all campaign activities...')
      
      const { data, error } = await supabase
        .from('campaign_activities')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        handleCampaignError(error, 'fetching campaign activities')
      }
      
      console.log(`✅ Successfully fetched ${data?.length || 0} campaign activities`)
      return data || []
    } catch (error) {
      console.error('Error fetching campaign activities:', error)
      throw error
    }
  },

  async getActiveCampaignActivities(): Promise<CampaignActivity[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_activities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        handleCampaignError(error, 'fetching active campaign activities')
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching active campaign activities:', error)
      throw error
    }
  },

  async createCampaignActivity(activityData: {
    name: string
    description?: string
    icon?: string
    is_active?: boolean
    sort_order?: number
    metadata?: any
  }): Promise<CampaignActivity | null> {
    try {
      console.log('🔄 Creating campaign activity:', activityData.name)

      // Validate name
      if (!activityData.name?.trim()) {
        throw new Error('Namn krävs')
      }

      const { data, error } = await supabase
        .from('campaign_activities')
        .insert({
          name: activityData.name.trim(),
          description: activityData.description?.trim(),
          icon: activityData.icon,
          is_active: activityData.is_active !== undefined ? activityData.is_active : true,
          sort_order: activityData.sort_order || 0,
          metadata: activityData.metadata || {}
        })
        .select()
        .single()

      if (error) {
        handleCampaignError(error, 'creating campaign activity')
      }
      
      console.log('✅ Campaign activity created successfully:', data?.name)
      return data
    } catch (error) {
      console.error('Error creating campaign activity:', error)
      throw error
    }
  },

  async updateCampaignActivity(id: string, updates: Partial<CampaignActivity>): Promise<CampaignActivity | null> {
    try {
      console.log('🔄 Updating campaign activity:', id)

      // Validate updates
      if (updates.name !== undefined && !updates.name?.trim()) {
        throw new Error('Namn krävs')
      }

      const { data, error } = await supabase
        .from('campaign_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        handleCampaignError(error, 'updating campaign activity')
      }
      
      console.log('✅ Campaign activity updated successfully:', data?.name)
      return data
    } catch (error) {
      console.error('Error updating campaign activity:', error)
      throw error
    }
  },

  async deleteCampaignActivity(id: string): Promise<boolean> {
    try {
      console.log('🔄 Deleting campaign activity:', id)

      const { error } = await supabase
        .from('campaign_activities')
        .delete()
        .eq('id', id)

      if (error) {
        handleCampaignError(error, 'deleting campaign activity')
      }
      
      console.log('✅ Campaign activity deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting campaign activity:', error)
      throw error
    }
  },

  // Area Activities
  async getAreaActivities(areaId: string): Promise<AreaActivity[]> {
    try {
      const { data, error } = await supabase
        .from('area_activities')
        .select(`
          *,
          activity:campaign_activities(*),
          team:teams(name, color)
        `)
        .eq('area_id', areaId)
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        handleCampaignError(error, 'fetching area activities')
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching area activities:', error)
      throw error
    }
  },

  async createAreaActivity(activityData: {
    area_id: string
    activity_id: string
    team_id?: string
    status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
    scheduled_date?: string
    completed_date?: string
    notes?: string
    metadata?: any
  }): Promise<AreaActivity | null> {
    try {
      console.log('🔄 Creating area activity for area:', activityData.area_id)

      const { data, error } = await supabase
        .from('area_activities')
        .insert({
          area_id: activityData.area_id,
          activity_id: activityData.activity_id,
          team_id: activityData.team_id,
          status: activityData.status || 'planned',
          scheduled_date: activityData.scheduled_date,
          completed_date: activityData.completed_date,
          notes: activityData.notes,
          metadata: activityData.metadata || {}
        })
        .select()
        .single()

      if (error) {
        handleCampaignError(error, 'creating area activity')
      }
      
      console.log('✅ Area activity created successfully')
      return data
    } catch (error) {
      console.error('Error creating area activity:', error)
      throw error
    }
  },

  async updateAreaActivity(id: string, updates: Partial<AreaActivity>): Promise<AreaActivity | null> {
    try {
      console.log('🔄 Updating area activity:', id)

      const { data, error } = await supabase
        .from('area_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        handleCampaignError(error, 'updating area activity')
      }
      
      console.log('✅ Area activity updated successfully')
      return data
    } catch (error) {
      console.error('Error updating area activity:', error)
      throw error
    }
  },

  async deleteAreaActivity(id: string): Promise<boolean> {
    try {
      console.log('🔄 Deleting area activity:', id)

      const { error } = await supabase
        .from('area_activities')
        .delete()
        .eq('id', id)

      if (error) {
        handleCampaignError(error, 'deleting area activity')
      }
      
      console.log('✅ Area activity deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting area activity:', error)
      throw error
    }
  },

  // Get campaign activity options for dropdown/selection
  async getCampaignActivityOptions(): Promise<{ value: string; label: string; icon?: string }[]> {
    try {
      const activities = await this.getActiveCampaignActivities()
      
      return activities.map(activity => ({
        value: activity.id,
        label: activity.name,
        icon: activity.icon
      }))
    } catch (error) {
      console.error('Error fetching campaign activity options:', error)
      return []
    }
  },

  // Get campaign type options for dropdown/selection
  async getCampaignTypeOptions(): Promise<{ value: string; label: string; color: string; icon?: string }[]> {
    try {
      const types = await this.getActiveCampaignTypes()
      
      return types.map(type => ({
        value: type.id,
        label: type.name,
        color: type.color,
        icon: type.icon
      }))
    } catch (error) {
      console.error('Error fetching campaign type options:', error)
      return []
    }
  }
}