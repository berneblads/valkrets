import { supabase } from './supabase'

export interface Team {
  id: string
  name: string
  description?: string
  color: string
  leader_id?: string
  status: 'active' | 'inactive' | 'archived'
  metadata?: any
  created_by?: string
  created_at: string
  updated_at: string
  version: number
}

export interface TeamMember {
  id: string
  team_id: string
  user_id?: string
  role: 'leader' | 'member' | 'coordinator'
  joined_at: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface TeamArea {
  id: string
  team_id: string
  area_id: string
  assigned_at: string
  assigned_by?: string
  priority: number
  status: 'assigned' | 'in_progress' | 'completed'
  notes?: string
  created_at: string
}

export interface TeamWithDetails extends Team {
  member_count?: number
  area_count?: number
  members?: TeamMember[]
  areas?: TeamArea[]
}

// Enhanced error handling utility
const handleTeamError = (error: any, operation: string) => {
  console.error(`Team service error ${operation}:`, error)
  
  if (error?.message?.includes('duplicate key')) {
    throw new Error('Ett team med detta namn finns redan')
  }
  
  if (error?.message?.includes('foreign key')) {
    throw new Error('Kan inte ta bort team som har tilldelade områden')
  }
  
  throw new Error(`Fel vid ${operation}: ${error?.message || 'Okänt fel'}`)
}

export const teamService = {
  // Get all teams
  async getAll(): Promise<TeamWithDetails[]> {
    try {
      console.log('🔍 Fetching all teams...')
      
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members!inner(count),
          team_areas!inner(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        handleTeamError(error, 'fetching teams')
      }

      // Get member and area counts
      const teamsWithCounts = await Promise.all(
        (data || []).map(async (team) => {
          const [memberCount, areaCount] = await Promise.all([
            this.getMemberCount(team.id),
            this.getAreaCount(team.id)
          ])
          
          return {
            ...team,
            member_count: memberCount,
            area_count: areaCount
          }
        })
      )
      
      console.log(`✅ Successfully fetched ${teamsWithCounts.length} teams`)
      return teamsWithCounts
    } catch (error) {
      console.error('Error fetching teams:', error)
      throw error
    }
  },

  // Get team by ID with full details
  async getById(id: string): Promise<TeamWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(*),
          team_areas(*, areas(*))
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        handleTeamError(error, 'fetching team')
      }

      return data
    } catch (error) {
      console.error('Error fetching team by ID:', error)
      throw error
    }
  },

  // Create a new team
  async create(teamData: {
    name: string
    description?: string
    color?: string
    leader_id?: string
    metadata?: any
  }): Promise<Team | null> {
    try {
      console.log('🔄 Creating team:', teamData.name)

      // Validate team name
      if (!teamData.name?.trim()) {
        throw new Error('Teamnamn krävs')
      }

      if (teamData.name.length > 50) {
        throw new Error('Teamnamn får inte vara längre än 50 tecken')
      }

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name.trim(),
          description: teamData.description?.trim(),
          color: teamData.color || '#003366',
          leader_id: teamData.leader_id,
          metadata: teamData.metadata || {},
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        handleTeamError(error, 'creating team')
      }
      
      console.log('✅ Team created successfully:', data?.name)
      return data
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    }
  },

  // Update a team
  async update(id: string, updates: Partial<Team>): Promise<Team | null> {
    try {
      console.log('🔄 Updating team:', id)

      // Validate updates
      if (updates.name !== undefined) {
        if (!updates.name?.trim()) {
          throw new Error('Teamnamn krävs')
        }
        if (updates.name.length > 50) {
          throw new Error('Teamnamn får inte vara längre än 50 tecken')
        }
        updates.name = updates.name.trim()
      }

      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        handleTeamError(error, 'updating team')
      }
      
      console.log('✅ Team updated successfully:', data?.name)
      return data
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    }
  },

  // Delete a team
  async delete(id: string): Promise<boolean> {
    try {
      console.log('🔄 Deleting team:', id)

      // Check if team has assigned areas
      const { data: areas } = await supabase
        .from('team_areas')
        .select('id')
        .eq('team_id', id)
        .limit(1)

      if (areas && areas.length > 0) {
        throw new Error('Kan inte ta bort team som har tilldelade områden. Ta bort områdestilldelningar först.')
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (error) {
        handleTeamError(error, 'deleting team')
      }
      
      console.log('✅ Team deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting team:', error)
      throw error
    }
  },

  // Archive a team instead of deleting
  async archive(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status: 'archived' })
        .eq('id', id)

      if (error) {
        handleTeamError(error, 'archiving team')
      }
      
      return true
    } catch (error) {
      console.error('Error archiving team:', error)
      throw error
    }
  },

  // Get member count for a team
  async getMemberCount(teamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active')

      if (error) {
        console.error('Error getting member count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error getting member count:', error)
      return 0
    }
  },

  // Get area count for a team
  async getAreaCount(teamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('team_areas')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)

      if (error) {
        console.error('Error getting area count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error getting area count:', error)
      return 0
    }
  },

  // Assign area to team
  async assignArea(areaId: string, teamId: string): Promise<boolean> {
    try {
      console.log('🔄 Assigning area to team:', areaId, teamId)

      const { error } = await supabase.rpc('assign_area_to_team', {
        area_id_param: areaId,
        team_id_param: teamId
      })

      if (error) {
        handleTeamError(error, 'assigning area to team')
      }
      
      console.log('✅ Area assigned to team successfully')
      return true
    } catch (error) {
      console.error('Error assigning area to team:', error)
      throw error
    }
  },

  // Remove area from team
  async removeArea(areaId: string): Promise<boolean> {
    try {
      console.log('🔄 Removing area from team:', areaId)

      const { error } = await supabase.rpc('remove_area_from_team', {
        area_id_param: areaId
      })

      if (error) {
        handleTeamError(error, 'removing area from team')
      }
      
      console.log('✅ Area removed from team successfully')
      return true
    } catch (error) {
      console.error('Error removing area from team:', error)
      throw error
    }
  },

  // Get teams for dropdown/selection
  async getTeamOptions(): Promise<{ value: string; label: string; color: string }[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching team options:', error)
        return []
      }

      return (data || []).map(team => ({
        value: team.id,
        label: team.name,
        color: team.color
      }))
    } catch (error) {
      console.error('Error fetching team options:', error)
      return []
    }
  },

  // Validate team name
  async validateTeamName(name: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('teams')
        .select('id')
        .eq('name', name.trim())
        .eq('status', 'active')

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error validating team name:', error)
        return false
      }

      return !data || data.length === 0
    } catch (error) {
      console.error('Error validating team name:', error)
      return false
    }
  },

  // Remove all pre-programmed teams
  async removeDefaultTeams(): Promise<boolean> {
    try {
      console.log('🔄 Removing default teams...')

      const { error } = await supabase
        .from('teams')
        .delete()
        .in('name', ['Team A', 'Team B', 'Team C'])

      if (error) {
        console.error('Error removing default teams:', error)
        return false
      }
      
      console.log('✅ Default teams removed successfully')
      return true
    } catch (error) {
      console.error('Error removing default teams:', error)
      return false
    }
  }
}