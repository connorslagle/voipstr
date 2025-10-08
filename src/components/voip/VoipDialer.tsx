import React, { useState } from 'react';
import { Search, Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useVoip } from './VoipProvider';
import { useAuthor } from '@/hooks/useAuthor';
import { useNostr } from '@nostrify/react';

interface Contact {
  pubkey: string;
  name: string;
  picture?: string;
  status: 'online' | 'offline' | 'busy';
}

export function VoipDialer() {
  const { startCall, endCall, isCallActive, currentCall } = useVoip();
  const { nostr } = useNostr();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Mock contacts - in a real app, this would come from follows or other sources
  const [contacts] = useState<Contact[]>([
    {
      pubkey: 'npub1example1',
      name: 'John Doe',
      picture: 'https://example.com/john.jpg',
      status: 'online'
    },
    {
      pubkey: 'npub1example2',
      name: 'Jane Smith',
      picture: 'https://example.com/jane.jpg',
      status: 'offline'
    },
    {
      pubkey: 'npub1example3',
      name: 'Bob Johnson',
      status: 'busy'
    }
  ]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCall = (pubkey: string) => {
    startCall(pubkey);
  };

  const toggleMute = () => {
    if (currentCall?.stream) {
      const audioTrack = currentCall.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Call Status */}
      {isCallActive && currentCall && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              Call in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Avatar className="h-16 w-16 mx-auto">
              <AvatarFallback>
                {currentCall.pubkey.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-gray-600">
              Connected to {currentCall.pubkey.slice(0, 10)}...
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button onClick={endCall} variant="destructive" size="sm">
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Contacts</h3>
        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <Card key={contact.pubkey} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.picture} alt={contact.name} />
                    <AvatarFallback>
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          contact.status === 'online' ? 'default' :
                          contact.status === 'busy' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {contact.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleCall(contact.pubkey)}
                  disabled={isCallActive || contact.status === 'offline'}
                  size="sm"
                  variant={contact.status === 'online' ? 'default' : 'secondary'}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Dial */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Dial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-12 text-lg"
                onClick={() => setSearchTerm(prev => prev + num.toString())}
              >
                {num}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}