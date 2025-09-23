import { supabase } from './supabase'

export interface Asset {
  id: string
  name: string
  description?: string
  asset_type: 'logo' | 'icon' | 'graphic' | 'document' | 'image'
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  is_public: boolean
  metadata?: any
  created_at: string
  updated_at: string
}

export const assetService = {
  // Get all assets
  async getAll(): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching assets:', error)
        return []
      }
      return data || []
    } catch (error) {
      console.error('Error fetching assets:', error)
      return []
    }
  },

  // Get assets by type
  async getByType(assetType: Asset['asset_type']): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_type', assetType)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching assets by type:', error)
        return []
      }
      return data || []
    } catch (error) {
      console.error('Error fetching assets by type:', error)
      return []
    }
  },

  // Get KD logo
  async getKDLogo(): Promise<Asset | null> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('asset_type', 'logo')
        .eq('name', 'KD Logotyp')
        .single()

      if (error) {
        console.error('Supabase error fetching KD logo:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Error fetching KD logo:', error)
      return null
    }
  },

  // Create a new asset
  async create(assetData: {
    name: string
    description?: string
    asset_type: Asset['asset_type']
    file_name: string
    file_path: string
    file_size?: number
    mime_type?: string
    is_public?: boolean
    metadata?: any
  }): Promise<Asset | null> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert({
          name: assetData.name,
          description: assetData.description,
          asset_type: assetData.asset_type,
          file_name: assetData.file_name,
          file_path: assetData.file_path,
          file_size: assetData.file_size,
          mime_type: assetData.mime_type,
          is_public: assetData.is_public ?? true,
          metadata: assetData.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating asset:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Error creating asset:', error)
      return null
    }
  },

  // Update an asset
  async update(id: string, updates: Partial<Asset>): Promise<Asset | null> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error updating asset:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Error updating asset:', error)
      return null
    }
  },

  // Delete an asset
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase error deleting asset:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Error deleting asset:', error)
      return false
    }
  },

  // Upload file to Supabase Storage (if using storage)
  async uploadFile(file: File, path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(path, file)

      if (error) {
        console.error('Supabase storage error:', error)
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }
}