import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CallQualityMetrics {
  rtt: number; // Round-trip time in ms
  packetLoss: number; // Percentage 0-100
  jitter: number; // Jitter in ms
  bitrate: number; // Audio bitrate in kbps
}

export function VoipCallQuality({ peer }: { peer: RTCPeerConnection | null }) {
  const [metrics, setMetrics] = useState<CallQualityMetrics>({
    rtt: 0,
    packetLoss: 0,
    jitter: 0,
    bitrate: 0
  });

  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

  useEffect(() => {
    if (!peer) return;

    const interval = setInterval(async () => {
      try {
        const stats = await peer.getStats();
        let rtt = 0;
        let packetsSent = 0;
        let packetsReceived = 0;
        let packetsLost = 0;
        let jitter = 0;
        let bitrate = 0;

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime || 0;
          }
          
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            packetsReceived = report.packetsReceived || 0;
            packetsLost = report.packetsLost || 0;
            jitter = report.jitter || 0;
          }
          
          if (report.type === 'outbound-rtp' && report.kind === 'audio') {
            packetsSent = report.packetsSent || 0;
            bitrate = report.targetBitrate || 0;
          }
        });

        const packetLoss = packetsSent > 0 ? (packetsLost / (packetsSent + packetsReceived)) * 100 : 0;

        setMetrics({
          rtt: Math.round(rtt * 1000),
          packetLoss: Math.round(packetLoss * 100) / 100,
          jitter: Math.round(jitter * 1000),
          bitrate: Math.round(bitrate / 1000)
        });

        // Determine connection quality
        if (rtt < 50 && packetLoss < 1 && jitter < 10) {
          setConnectionQuality('excellent');
        } else if (rtt < 100 && packetLoss < 3 && jitter < 30) {
          setConnectionQuality('good');
        } else if (rtt < 200 && packetLoss < 5 && jitter < 50) {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('poor');
        }
      } catch (error) {
        console.error('Error getting WebRTC stats:', error);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [peer]);

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <SignalHigh className="h-4 w-4 text-green-500" />;
      case 'good':
        return <SignalMedium className="h-4 w-4 text-blue-500" />;
      case 'fair':
        return <SignalLow className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getQualityText = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="w-64">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          {getQualityIcon()}
          <span>Call Quality</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <Badge className={getQualityColor()}>
            {getQualityText()}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Latency</span>
            <span className={metrics.rtt > 100 ? 'text-red-500' : 'text-gray-900'}>
              {metrics.rtt}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Packet Loss</span>
            <span className={metrics.packetLoss > 2 ? 'text-red-500' : 'text-gray-900'}>
              {metrics.packetLoss}%
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Jitter</span>
            <span className={metrics.jitter > 30 ? 'text-red-500' : 'text-gray-900'}>
              {metrics.jitter}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Bitrate</span>
            <span className="text-gray-900">
              {metrics.bitrate}kbps
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}