import React from 'react';
import { Wifi, WifiOff, Phone, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useVoip } from './VoipProvider';

export function VoipStatus() {
  const { isCallActive, isCallIncoming } = useVoip();

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={isCallActive ? "destructive" : isCallIncoming ? "default" : "secondary"}
        className="flex items-center space-x-1"
      >
        {isCallActive ? (
          <>
            <Phone className="h-3 w-3" />
            <span>In Call</span>
          </>
        ) : isCallIncoming ? (
          <>
            <PhoneIncoming className="h-3 w-3 animate-pulse" />
            <span>Incoming</span>
          </>
        ) : (
          <>
            <Wifi className="h-3 w-3" />
            <span>Ready</span>
          </>
        )}
      </Badge>
    </div>
  );
}