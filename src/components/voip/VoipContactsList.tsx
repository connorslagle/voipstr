import React, { useState } from 'react';
import { Search, Phone, PhoneOff, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useVoipContacts } from '@/hooks/useVoipContacts';
import { useVoip } from './VoipProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function VoipContactsList() {
  const { data: contacts, isLoading } = useVoipContacts();
  const { startCall, isCallActive, currentCall } = useVoip();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts?.filter(contact => {
    if (!searchTerm) return true;
    return contact.pubkey.toLowerCase().includes(searchTerm.toLowerCase()) ||
           contact.name?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'default';
      case 'busy':
        return 'destructive';
      case 'in-call':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Busy';
      case 'in-call':
        return 'In Call';
      default:
        return 'Offline';
    }
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading contacts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No contacts found</p>
            <p className="text-sm mt-2">Make sure you follow people on Nostr</p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isInCallWithThisUser = currentCall?.pubkey === contact.pubkey && isCallActive;
            
            return (
              <div
                key={contact.pubkey}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.picture} alt={contact.name} />
                      <AvatarFallback>
                        {(contact.name || contact.pubkey.slice(0, 2)).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      contact.status === 'online' ? 'bg-green-500' :
                      contact.status === 'busy' ? 'bg-red-500' :
                      contact.status === 'in-call' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {contact.name || contact.pubkey.slice(0, 10)}...
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Badge variant={getStatusColor(contact.status)} className="text-xs">
                        {getStatusText(contact.status)}
                      </Badge>
                      {contact.lastSeen && (
                        <span className="text-xs">
                          {formatLastSeen(contact.lastSeen)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => startCall(contact.pubkey)}
                    disabled={isCallActive && !isInCallWithThisUser || contact.status === 'offline'}
                    size="sm"
                    variant={isInCallWithThisUser ? "destructive" : "default"}
                  >
                    {isInCallWithThisUser ? (
                      <PhoneOff className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                      <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Block</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}