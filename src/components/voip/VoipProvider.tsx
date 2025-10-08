import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

interface VoipContextType {
  isCallActive: boolean;
  isCallIncoming: boolean;
  currentCall: {
    pubkey: string;
    peer: any | null;
    stream: MediaStream | null;
  } | null;
  startCall: (pubkey: string) => void;
  endCall: () => void;
  answerCall: (pubkey: string, offer: any) => void;
  rejectCall: (pubkey: string) => void;
}

const VoipContext = createContext<VoipContextType | undefined>(undefined);

export function VoipProvider({ children }: { children: React.ReactNode }) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();

  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [currentCall, setCurrentCall] = useState<{
    pubkey: string;
    peer: any | null;
    stream: MediaStream | null;
  } | null>(null);

  // Generate a unique kind for VOIP signaling
  const VOIP_KIND = 39000; // Regular event kind for signaling

  // Listen for incoming call signals
  useEffect(() => {
    if (!user) return;

    const signal = AbortSignal.timeout(30000);

    const subscription = nostr.req([
      {
        kinds: [VOIP_KIND],
        '#p': [user.pubkey],
        limit: 10,
      }
    ], { signal });

    subscription.addEventListener('event', async (event) => {
      if (event.pubkey === user.pubkey) return; // Ignore our own events

      const signalData = JSON.parse(event.content);

      if (signalData.type === 'offer' && !isCallActive) {
        setIsCallIncoming(true);
        // Store the offer for when user answers
        setCurrentCall(prev => ({
          pubkey: event.pubkey,
          peer: null,
          stream: null,
          ...prev
        }));
      } else if (signalData.type === 'answer' && currentCall?.pubkey === event.pubkey) {
        // Handle answer to our outgoing call
        if (currentCall.peer) {
          currentCall.peer.signal(signalData.sdp);
        }
      } else if (signalData.type === 'ice-candidate' && currentCall?.pubkey === event.pubkey) {
        // Handle ICE candidates
        if (currentCall.peer) {
          currentCall.peer.signal(signalData.candidate);
        }
      } else if (signalData.type === 'end-call') {
        // Handle call termination
        endCall();
      }
    });

    return () => {
      subscription.close();
      signal.abort();
    };
  }, [user, nostr, isCallActive, currentCall]);

  const startCall = async (pubkey: string) => {
    if (!user) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Create peer connection (mock implementation for now)
      const peer = {
        on: (event: string, callback: Function) => {
          // Mock peer event handlers
          console.log(`Mock peer event: ${event}`);
          if (event === 'connect') {
            setTimeout(callback, 1000);
          }
        },
        signal: (data: any) => {
          console.log('Mock peer signal:', data);
        },
        destroy: () => {
          console.log('Mock peer destroyed');
        }
      };

      // Simulate signaling
      setTimeout(async () => {
        await publishEvent({
          kind: VOIP_KIND,
          content: JSON.stringify({
            type: 'offer',
            sdp: { type: 'offer', sdp: 'mock-offer-sdp' }
          }),
          tags: [['p', pubkey]]
        });
      }, 500);

      // Simulate connection
      setTimeout(() => {
        setIsCallActive(true);
      }, 1500);

      setCurrentCall({
        pubkey,
        peer,
        stream
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const answerCall = async (pubkey: string, offer: any) => {
    if (!user) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Create peer connection (mock implementation for now)
      const peer = {
        signal: (data: any) => {
          console.log('Mock peer signal:', data);
        },
        on: (event: string, callback: Function) => {
          console.log(`Mock peer event: ${event}`);
          if (event === 'connect') {
            setTimeout(callback, 1000);
          }
        },
        destroy: () => {
          console.log('Mock peer destroyed');
        }
      };

      // Simulate answer signaling
      setTimeout(async () => {
        await publishEvent({
          kind: VOIP_KIND,
          content: JSON.stringify({
            type: 'answer',
            sdp: { type: 'answer', sdp: 'mock-answer-sdp' }
          }),
          tags: [['p', pubkey]]
        });
      }, 500);

      // Simulate connection
      setTimeout(() => {
        setIsCallActive(true);
        setIsCallIncoming(false);
      }, 1500);

      setCurrentCall({
        pubkey,
        peer,
        stream
      });
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };

  const endCall = () => {
    if (currentCall?.peer) {
      currentCall.peer.destroy();
    }

    if (currentCall?.stream) {
      currentCall.stream.getTracks().forEach(track => track.stop());
    }

    // Send end call signal
    if (currentCall?.pubkey && user) {
      publishEvent({
        kind: VOIP_KIND,
        content: JSON.stringify({
          type: 'end-call'
        }),
        tags: [['p', currentCall.pubkey]]
      });
    }

    setCurrentCall(null);
    setIsCallActive(false);
    setIsCallIncoming(false);
  };

  const rejectCall = (pubkey: string) => {
    setIsCallIncoming(false);
    setCurrentCall(null);
  };

  return (
    <VoipContext.Provider value={{
      isCallActive,
      isCallIncoming,
      currentCall,
      startCall,
      endCall,
      answerCall,
      rejectCall
    }}>
      {children}
    </VoipContext.Provider>
  );
}

export function useVoip() {
  const context = useContext(VoipContext);
  if (context === undefined) {
    throw new Error('useVoip must be used within a VoipProvider');
  }
  return context;
}