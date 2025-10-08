import React, { useEffect } from 'react';
import { Phone, PhoneMissed, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useVoip } from './VoipProvider';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';

interface MissedCallToastProps {
  pubkey: string;
  timestamp: Date;
  onClose: () => void;
}

export function VoipMissedCallToast({ pubkey, timestamp, onClose }: MissedCallToastProps) {
  const { startCall } = useVoip();
  const author = useAuthor(pubkey);
  const { toast } = useToast();
  const metadata = author.data?.metadata;

  const handleCallBack = () => {
    startCall(pubkey);
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="mb-2 border-red-200 bg-red-50 dark:bg-red-900/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={metadata?.picture} alt={metadata?.name} />
                <AvatarFallback>
                  {(metadata?.name || 'Unknown').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1">
                <PhoneMissed className="h-3 w-3" />
              </div>
            </div>
            
            <div>
              <p className="font-medium text-sm">
                {metadata?.name || pubkey.slice(0, 10)}...
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <Badge variant="destructive" className="text-xs">
                  Missed Call
                </Badge>
                <span>{formatTime(timestamp)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleCallBack}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VoipMissedCallManager() {
  const { toast } = useToast();
  const [missedCalls, setMissedCalls] = React.useState<Array<{
    id: string;
    pubkey: string;
    timestamp: Date;
  }>>([]);

  // Listen for missed calls (this would be integrated with the VoipProvider)
  useEffect(() => {
    // This is a mock implementation
    // In a real app, this would listen to Nostr events for call-ended signals
    const handleMissedCall = (pubkey: string) => {
      const newMissedCall = {
        id: Math.random().toString(36).substr(2, 9),
        pubkey,
        timestamp: new Date(),
      };
      
      setMissedCalls(prev => [...prev, newMissedCall]);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        setMissedCalls(prev => prev.filter(call => call.id !== newMissedCall.id));
      }, 10000);
    };

    // Mock missed call for demo
    const timer = setTimeout(() => {
      handleMissedCall('npub1example123');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const removeMissedCall = (id: string) => {
    setMissedCalls(prev => prev.filter(call => call.id !== id));
  };

  if (missedCalls.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {missedCalls.map((call) => (
        <VoipMissedCallToast
          key={call.id}
          pubkey={call.pubkey}
          timestamp={call.timestamp}
          onClose={() => removeMissedCall(call.id)}
        />
      ))}
    </div>
  );
}