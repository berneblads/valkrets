import React, { useState, useEffect } from 'react'
import { Upload, Download, Trash2, Eye, Plus, Image, FileText, Palette } from 'lucide-react'
import { assetService, Asset } from '../../lib/assetService'

export function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<Asset['asset_type'] | 'all'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    name: '',
    description: '',
    asset_type: 'logo' as Asset['asset_type'],
    file_path: '',
    is_public: true
  })

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const allAssets = await assetService.getAll()
      setAssets(allAssets)
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssets = selectedType === 'all' 
    ? assets 
    : assets.filter(asset => asset.asset_type === selectedType)

  const handleUpload = async () => {
    if (!uploadData.name || !uploadData.file_path) {
      alert('Namn och filsökväg krävs')
      return
    }

    try {
      const newAsset = await assetService.create(uploadData)
      if (newAsset) {
        setAssets(prev => [newAsset, ...prev])
        setShowUploadModal(false)
        setUploadData({
          name: '',
          description: '',
          asset_type: 'logo',
          file_path: '',
          is_public: true
        })
      }
    } catch (error) {
      console.error('Error uploading asset:', error)
      alert('Fel vid uppladdning av tillgång')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna tillgång?')) return

    try {
      const success = await assetService.delete(id)
      if (success) {
        setAssets(prev => prev.filter(asset => asset.id !== id))
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('Fel vid borttagning av tillgång')
    }
  }

  const getAssetIcon = (type: Asset['asset_type']) => {
    switch (type) {
      case 'logo':
      case 'icon':
        return <Image className="w-4 h-4" />
      case 'graphic':
        return <Palette className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      default:
        return <Image className="w-4 h-4" />
    }
  }

  const assetTypes = [
    { value: 'all', label: 'Alla typer' },
    { value: 'logo', label: 'Logotyper' },
    { value: 'icon', label: 'Ikoner' },
    { value: 'graphic', label: 'Grafik' },
    { value: 'document', label: 'Dokument' },
    { value: 'image', label: 'Bilder' }
  ]

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar tillgångar...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#003366] mb-2">Tillgångshantering</h2>
          <p className="text-gray-600">Hantera logotyper, ikoner och grafiska element</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Lägg till tillgång</span>
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#003366] mb-2">
          Filtrera efter typ:
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as Asset['asset_type'] | 'all')}
          className="px-3 py-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
        >
          {assetTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label} ({type.value === 'all' ? assets.length : assets.filter(a => a.asset_type === type.value).length})
            </option>
          ))}
        </select>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getAssetIcon(asset.asset_type)}
                <span className="text-sm font-medium text-[#003366] capitalize">
                  {asset.asset_type}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <a
                  href={asset.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-[#003366] hover:bg-[#F3F4F6] rounded transition-colors"
                  title="Visa"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Ta bort"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="font-medium text-[#003366] mb-2">{asset.name}</h3>
            
            {asset.description && (
              <p className="text-sm text-gray-600 mb-3">{asset.description}</p>
            )}

            {/* Preview */}
            {asset.mime_type?.startsWith('image/') && (
              <div className="mb-3">
                <img
                  src={asset.file_path}
                  alt={asset.name}
                  className="w-full h-24 object-contain bg-gray-50 rounded border"
                />
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>Filnamn: {asset.file_name}</p>
              {asset.file_size && (
                <p>Storlek: {(asset.file_size / 1024).toFixed(1)} KB</p>
              )}
              <p>Skapad: {new Date(asset.created_at).toLocaleDateString('sv-SE')}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Inga tillgångar hittades</h3>
          <p className="text-gray-500">
            {selectedType === 'all' 
              ? 'Lägg till din första tillgång genom att klicka på "Lägg till tillgång"'
              : `Inga tillgångar av typ "${assetTypes.find(t => t.value === selectedType)?.label}"`
            }
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#003366] mb-4">Lägg till ny tillgång</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#003366] mb-1">
                  Namn *
                </label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="t.ex. KD Logotyp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#003366] mb-1">
                  Beskrivning
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  rows={3}
                  placeholder="Beskriv tillgången..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#003366] mb-1">
                  Typ *
                </label>
                <select
                  value={uploadData.asset_type}
                  onChange={(e) => setUploadData(prev => ({ ...prev, asset_type: e.target.value as Asset['asset_type'] }))}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                >
                  <option value="logo">Logotyp</option>
                  <option value="icon">Ikon</option>
                  <option value="graphic">Grafik</option>
                  <option value="document">Dokument</option>
                  <option value="image">Bild</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#003366] mb-1">
                  Filsökväg/URL *
                </label>
                <input
                  type="url"
                  value={uploadData.file_path}
                  onChange={(e) => setUploadData(prev => ({ ...prev, file_path: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                  placeholder="https://example.com/logo.svg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={uploadData.is_public}
                  onChange={(e) => setUploadData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-[#E5E7EB] text-[#003366] focus:ring-[#003366]"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-[#003366]">
                  Offentlig tillgång
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-[#003366] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#004080] transition-colors"
              >
                Lägg till
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}