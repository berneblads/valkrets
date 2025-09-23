import React, { useState, useEffect } from 'react'
import { X, Users, Palette, Save } from 'lucide-react'
import { teamService, TeamWithDetails } from '../../lib/teamService'

interface TeamEditModalProps {
  team: TeamWithDetails
  onClose: () => void
  onSave: (id: string, updates: any) => Promise<void>
}

const presetColors = [
  '#003366', // KD blue
  '#FFD700', // KD gold
  '#4A90E2', // Light blue
  '#50C878', // Emerald green
  '#FF6B6B', // Coral red
  '#9B59B6', // Purple
  '#F39C12', // Orange
  '#1ABC9C', // Turquoise
  '#E74C3C', // Red
  '#34495E', // Dark blue-gray
  '#16A085', // Dark turquoise
  '#8E44AD'  // Dark purple
]

export function TeamEditModal({ team, onClose, onSave }: TeamEditModalProps) {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    color: team.color,
    status: team.status
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const validateName = async (name: string) => {
    if (!name.trim()) {
      setNameError('Teamnamn krävs')
      return false
    }

    if (name.length > 50) {
      setNameError('Teamnamn får inte vara längre än 50 tecken')
      return false
    }

    // Only validate if name has changed
    if (name.trim() !== team.name) {
      try {
        const isValid = await teamService.validateTeamName(name, team.id)
        if (!isValid) {
          setNameError('Ett team med detta namn finns redan')
          return false
        }
      } catch (error) {
        console.error('Error validating team name:', error)
      }
    }

    setNameError(null)
    return true
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, name }))
    
    // Clear previous error
    setNameError(null)
    
    // Validate after a short delay
    if (name.trim()) {
      setTimeout(() => validateName(name), 500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (nameError) return
    
    const isNameValid = await validateName(formData.name)
    if (!isNameValid) return

    setLoading(true)
    setError(null)

    try {
      const updates: any = {}
      
      // Only include changed fields
      if (formData.name.trim() !== team.name) {
        updates.name = formData.name.trim()
      }
      
      if (formData.description.trim() !== (team.description || '')) {
        updates.description = formData.description.trim() || null
      }
      
      if (formData.color !== team.color) {
        updates.color = formData.color
      }
      
      if (formData.status !== team.status) {
        updates.status = formData.status
      }

      // Only save if there are actual changes
      if (Object.keys(updates).length > 0) {
        await onSave(team.id, updates)
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Error updating team:', error)
      setError(error instanceof Error ? error.message : 'Fel vid uppdatering av team')
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = () => {
    return (
      formData.name.trim() !== team.name ||
      formData.description.trim() !== (team.description || '') ||
      formData.color !== team.color ||
      formData.status !== team.status
    )
  }

  const isValid = formData.name.trim() && !nameError && !loading && hasChanges()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#003366] flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Redigera team
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F3F4F6] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-[#003366] mb-1">
              Teamnamn *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent ${
                nameError ? 'border-red-300' : 'border-[#E5E7EB]'
              }`}
              placeholder="t.ex. Malmö Team"
              maxLength={50}
              required
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600">{nameError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/50 tecken
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#003366] mb-1">
              Beskrivning
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
              placeholder="Beskriv teamets ansvar och mål..."
              rows={3}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/200 tecken
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#003366] mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="archived">Arkiverad</option>
            </select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-[#003366] mb-2">
              Teamfärg
            </label>
            
            {/* Color Preview */}
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-12 h-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-sm text-gray-600 font-mono">{formData.color}</span>
            </div>

            {/* Preset Colors */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {presetColors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    formData.color === color 
                      ? 'border-[#003366] shadow-lg' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Färg ${index + 1}`}
                />
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded focus:ring-2 focus:ring-[#003366] font-mono text-sm"
                placeholder="#003366"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#003366] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <Save className="w-4 h-4" />
              <span>{loading ? 'Sparar...' : 'Spara ändringar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}