import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoipDialer } from '@/components/voip/VoipDialer';
import { VoipCallLog } from '@/components/voip/VoipCallLog';
import { VoipCallInterface } from '@/components/voip/VoipCallButton';
import { VoipContactsList } from '@/components/voip/VoipContactsList';
import { VoipSettings } from '@/components/voip/VoipSettings';
import { Phone, History, Settings, Users } from 'lucide-react';

export function VoipPage() {
  const [activeTab, setActiveTab] = useState('dialer');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Call Interface Overlay */}
      <VoipCallInterface pubkey="" />

      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Nostr VOIP
          </h1>
          <p className="text-gray-600">
            Make voice calls over the Nostr network
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dialer" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Dialer</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dialer" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Make a Call</CardTitle>
              </CardHeader>
              <CardContent>
                <VoipDialer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <VoipContactsList />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Call History</CardTitle>
              </CardHeader>
              <CardContent>
                <VoipCallLog />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <VoipSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}