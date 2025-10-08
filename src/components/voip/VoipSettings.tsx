import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Wifi, Shield, Bell, Volume2 } from 'lucide-react';

interface VoipSettings {
  autoAnswer: boolean;
  showNotifications: boolean;
  recordCalls: boolean;
  contactsOnly: boolean;
  blockUnknown: boolean;
  stunServer: string;
  turnServer: string;
  audioInput: string;
  audioOutput: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export function VoipSettings() {
  const [settings, setSettings] = useState<VoipSettings>({
    autoAnswer: false,
    showNotifications: true,
    recordCalls: false,
    contactsOnly: true,
    blockUnknown: false,
    stunServer: 'stun:stun.l.google.com:19302',
    turnServer: '',
    audioInput: 'default',
    audioOutput: 'default',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  const [audioDevices, setAudioDevices] = useState<{
    input: MediaDeviceInfo[];
    output: MediaDeviceInfo[];
  }>({ input: [], output: [] });

  React.useEffect(() => {
    // Get available audio devices
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputDevices = devices.filter(device => device.kind === 'audioinput');
        const outputDevices = devices.filter(device => device.kind === 'audiooutput');
        setAudioDevices({ input: inputDevices, output: outputDevices });
      } catch (error) {
        console.error('Error getting audio devices:', error);
      }
    };

    getDevices();
  }, []);

  const updateSetting = <K extends keyof VoipSettings>(
    key: K, 
    value: VoipSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTestAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          deviceId: settings.audioInput !== 'default' ? settings.audioInput : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
        }
      });
      
      // Play test sound
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      // Create a test tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1); // Play for 1 second
      
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 2000);
      
    } catch (error) {
      console.error('Error testing audio:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Audio Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="audioInput">Microphone</Label>
              <Select value={settings.audioInput} onValueChange={(value) => updateSetting('audioInput', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Microphone</SelectItem>
                  {audioDevices.input.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="audioOutput">Speaker</Label>
              <Select value={settings.audioOutput} onValueChange={(value) => updateSetting('audioOutput', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select speaker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Speaker</SelectItem>
                  {audioDevices.output.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="echoCancellation">Echo Cancellation</Label>
              <Switch
                id="echoCancellation"
                checked={settings.echoCancellation}
                onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="noiseSuppression">Noise Suppression</Label>
              <Switch
                id="noiseSuppression"
                checked={settings.noiseSuppression}
                onCheckedChange={(checked) => updateSetting('noiseSuppression', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoGainControl">Auto Gain Control</Label>
              <Switch
                id="autoGainControl"
                checked={settings.autoGainControl}
                onCheckedChange={(checked) => updateSetting('autoGainControl', checked)}
              />
            </div>
          </div>
          
          <Button onClick={handleTestAudio} variant="outline" className="w-full">
            Test Audio
          </Button>
        </CardContent>
      </Card>

      {/* Network Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Network Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stunServer">STUN Server</Label>
            <Input
              id="stunServer"
              value={settings.stunServer}
              onChange={(e) => updateSetting('stunServer', e.target.value)}
              placeholder="stun:server:port"
            />
          </div>
          
          <div>
            <Label htmlFor="turnServer">TURN Server (Optional)</Label>
            <Input
              id="turnServer"
              value={settings.turnServer}
              onChange={(e) => updateSetting('turnServer', e.target.value)}
              placeholder="turn:server:port"
            />
            <p className="text-sm text-gray-500 mt-1">
              Required for calls behind restrictive NATs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Call Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Call Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoAnswer">Auto-answer calls</Label>
              <Switch
                id="autoAnswer"
                checked={settings.autoAnswer}
                onCheckedChange={(checked) => updateSetting('autoAnswer', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showNotifications">Show notifications for calls</Label>
              <Switch
                id="showNotifications"
                checked={settings.showNotifications}
                onCheckedChange={(checked) => updateSetting('showNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="recordCalls">Record calls</Label>
              <Switch
                id="recordCalls"
                checked={settings.recordCalls}
                onCheckedChange={(checked) => updateSetting('recordCalls', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="contactsOnly">Allow calls from contacts only</Label>
              <Switch
                id="contactsOnly"
                checked={settings.contactsOnly}
                onCheckedChange={(checked) => updateSetting('contactsOnly', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="blockUnknown">Block unknown callers</Label>
              <Switch
                id="blockUnknown"
                checked={settings.blockUnknown}
                onCheckedChange={(checked) => updateSetting('blockUnknown', checked)}
              />
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Privacy Note:</strong> All calls are peer-to-peer and encrypted. 
              Nostr is only used for signaling - your audio never goes through relays.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button className="w-full" size="lg">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}