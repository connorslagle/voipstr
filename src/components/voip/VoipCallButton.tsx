import React from 'react';
import { Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoip } from './VoipProvider';
import { useAuthor } from '@/hooks/useAuthor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VoipCallQuality } from './VoipCallQuality';

interface VoipCallButtonProps {
  pubkey: string;
  className?: string;
}

export function VoipCallButton({ pubkey, className }: VoipCallButtonProps) {
  const { startCall, isCallActive, currentCall } = useVoip();
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;

  const isInCallWithThisUser = currentCall?.pubkey === pubkey && isCallActive;

  const handleCall = () => {
    if (!isInCallWithThisUser) {
      startCall(pubkey);
    }
  };

  return (
    <Button
      variant={isInCallWithThisUser ? "destructive" : "default"}
      size="sm"
      className={className}
      onClick={handleCall}
      disabled={isCallActive && !isInCallWithThisUser}
    >
      {isInCallWithThisUser ? (
        <>
          <PhoneOff className="h-4 w-4 mr-2" />
          End Call
        </>
      ) : (
        <>
          <Phone className="h-4 w-4 mr-2" />
          Call
        </>
      )}
    </Button>
  );
}

interface VoipCallInterfaceProps {
  pubkey: string;
}

export function VoipCallInterface({ pubkey }: VoipCallInterfaceProps) {
  const {
    isCallActive,
    isCallIncoming,
    currentCall,
    endCall,
    answerCall,
    rejectCall
  } = useVoip();
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(true);
  const [callDuration, setCallDuration] = React.useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const toggleMute = () => {
    if (currentCall?.stream) {
      const audioTrack = currentCall.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real implementation, this would control audio output device
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isCallActive && !isCallIncoming) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center text-white max-w-4xl w-full mx-4">
        <div className="flex justify-center mb-8">
          <Avatar className="h-32 w-32">
            <AvatarImage src={metadata?.picture} alt={metadata?.name} />
            <AvatarFallback className="text-3xl">
              {(metadata?.name || 'Unknown').charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        <h2 className="text-4xl font-semibold mb-2">
          {metadata?.name || 'Unknown'}
        </h2>

        <p className="text-xl text-gray-300 mb-8">
          {isCallIncoming ? 'Incoming call...' : formatDuration(callDuration)}
        </p>

        {isCallIncoming ? (
          <div className="flex justify-center space-x-6">
            <Button
              onClick={() => answerCall(pubkey, currentCall?.peer?.offer)}
              className="bg-green-500 hover:bg-green-600 h-16 w-16 rounded-full"
              size="lg"
            >
              <Phone className="h-8 w-8" />
            </Button>
            <Button
              onClick={() => rejectCall(pubkey)}
              variant="destructive"
              className="h-16 w-16 rounded-full"
              size="lg"
            >
              <PhoneOff className="h-8 w-8" />
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-center space-x-6">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "secondary"}
                className="h-16 w-16 rounded-full"
                size="lg"
              >
                {isMuted ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
              </Button>
              <Button
                onClick={toggleSpeaker}
                variant={isSpeakerOn ? "default" : "secondary"}
                className="h-16 w-16 rounded-full"
                size="lg"
              >
                {isSpeakerOn ? <Volume2 className="h-8 w-8" /> : <VolumeX className="h-8 w-8" />}
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={endCall}
                variant="destructive"
                className="h-16 w-16 rounded-full"
                size="lg"
              >
                <PhoneOff className="h-8 w-8" />
              </Button>
            </div>

            {/* Call Quality Indicator */}
            <div className="flex justify-center">
              <VoipCallQuality peer={currentCall?.peer?._pc || null} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}