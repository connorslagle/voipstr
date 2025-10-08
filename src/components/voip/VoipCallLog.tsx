import React, { useState } from 'react';
import { Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useVoip } from './VoipProvider';
import { useAuthor } from '@/hooks/useAuthor';

interface CallLogEntry {
  id: string;
  pubkey: string;
  timestamp: Date;
  duration: number; // in seconds
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'completed' | 'missed' | 'rejected';
}

export function VoipCallLog() {
  const { startCall } = useVoip();
  
  // Mock call log data - in a real app, this would be stored locally or fetched from Nostr
  const [callLogs] = useState<CallLogEntry[]>([
    {
      id: '1',
      pubkey: 'npub1example1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      duration: 180, // 3 minutes
      type: 'incoming',
      status: 'completed'
    },
    {
      id: '2',
      pubkey: 'npub1example2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      duration: 0,
      type: 'outgoing',
      status: 'missed'
    },
    {
      id: '3',
      pubkey: 'npub1example3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      duration: 450, // 7.5 minutes
      type: 'outgoing',
      status: 'completed'
    }
  ]);

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Missed';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getCallIcon = (type: CallLogEntry['type'], status: CallLogEntry['status']) => {
    if (status === 'missed') {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    
    switch (type) {
      case 'incoming':
        return <PhoneIncoming className="h-4 w-4 text-green-500" />;
      case 'outgoing':
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getCallTypeText = (type: CallLogEntry['type'], status: CallLogEntry['status']) => {
    if (status === 'missed') {
      return 'Missed';
    }
    
    switch (type) {
      case 'incoming':
        return 'Incoming';
      case 'outgoing':
        return 'Outgoing';
      default:
        return 'Call';
    }
  };

  const handleCallBack = (pubkey: string) => {
    startCall(pubkey);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Call History</span>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {callLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No call history</p>
            </div>
          ) : (
            callLogs.map((log) => {
              const author = useAuthor(log.pubkey);
              const metadata = author.data?.metadata;
              
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={metadata?.picture} alt={metadata?.name} />
                      <AvatarFallback>
                        {(metadata?.name || 'Unknown').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex items-center space-x-2">
                      {getCallIcon(log.type, log.status)}
                      <div>
                        <p className="font-medium">
                          {metadata?.name || log.pubkey.slice(0, 10)}...
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(log.timestamp)}</span>
                          <span>•</span>
                          <span>{formatDuration(log.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        log.status === 'completed' ? 'default' :
                        log.status === 'missed' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {getCallTypeText(log.type, log.status)}
                    </Badge>
                    
                    {log.status === 'completed' && (
                      <Button
                        onClick={() => handleCallBack(log.pubkey)}
                        size="sm"
                        variant="outline"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}