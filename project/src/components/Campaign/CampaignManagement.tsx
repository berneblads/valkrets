import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../UI/Tabs'
import { CampaignTypeManager } from './CampaignTypeManager'
import { CampaignActivityManager } from './CampaignActivityManager'

export function CampaignManagement() {
  const [activeTab, setActiveTab] = useState('types')

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003366] mb-2">Kampanjhantering</h1>
        <p className="text-gray-600">Konfigurera kampanjtyper och aktiviteter för din organisation</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="types">Kampanjtyper</TabsTrigger>
          <TabsTrigger value="activities">Kampanjaktiviteter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="types">
          <CampaignTypeManager />
        </TabsContent>
        
        <TabsContent value="activities">
          <CampaignActivityManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}