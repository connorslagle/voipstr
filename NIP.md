# Nostr VOIP Protocol

## Overview

This document defines a protocol for Voice over IP (VOIP) communication over the Nostr network. The protocol uses WebRTC for peer-to-peer audio communication and Nostr for signaling, similar to the trade-offs made by zap.stream.

## Event Kinds

### Kind 39000: VOIP Signaling

This event kind is used for signaling between VOIP clients to establish and manage WebRTC connections.

#### Event Structure

```json
{
  "kind": 39000,
  "content": "<signaling-data>",
  "tags": [
    ["p", "<recipient-pubkey>"],
    ["alt", "VOIP signaling message"]
  ]
}
```

#### Signaling Data Types

The `content` field contains JSON-encoded signaling data with the following types:

##### 1. Offer

Sent by the call initiator to start a call.

```json
{
  "type": "offer",
  "sdp": {
    "type": "offer",
    "sdp": "<webrtc-offer-sdp>"
  },
  "callId": "<unique-call-identifier>",
  "timestamp": <unix-timestamp>
}
```

##### 2. Answer

Sent by the call recipient to accept a call.

```json
{
  "type": "answer",
  "sdp": {
    "type": "answer",
    "sdp": "<webrtc-answer-sdp>"
  },
  "callId": "<unique-call-identifier>",
  "timestamp": <unix-timestamp>
}
```

##### 3. ICE Candidate

Sent during call establishment to exchange network connectivity information.

```json
{
  "type": "ice-candidate",
  "candidate": {
    "candidate": "<ice-candidate-string>",
    "sdpMid": "<sdp-mid>",
    "sdpMLineIndex": <sdp-mline-index>,
    "foundation": "<foundation>"
  },
  "callId": "<unique-call-identifier>",
  "timestamp": <unix-timestamp>
}
```

##### 4. End Call

Sent to terminate an active call.

```json
{
  "type": "end-call",
  "callId": "<unique-call-identifier>",
  "reason": "<optional-reason>",
  "timestamp": <unix-timestamp>
}
```

##### 5. Call Status

Sent periodically during active calls to maintain connection status.

```json
{
  "type": "call-status",
  "callId": "<unique-call-identifier>",
  "status": "active|hold|transferring",
  "timestamp": <unix-timestamp>
}
```

### Kind 39001: Call Log (Optional)

This event kind can be used to store call history locally or share call metadata.

```json
{
  "kind": 39001,
  "content": "<call-metadata>",
  "tags": [
    ["p", "<other-party-pubkey>"],
    ["d", "<call-identifier>"],
    ["t", "voip-call"],
    ["duration", "<call-duration-in-seconds>"],
    ["status", "completed|missed|rejected|failed"],
    ["started", "<start-timestamp>"],
    ["ended", "<end-timestamp>"]
  ]
}
```

Example content:
```json
{
  "callType": "audio",
  "quality": {
    "avgLatency": 45,
    "packetLoss": 0.1,
    "bitrate": 64
  },
  "encryption": "webrtc-dtls-srtp"
}
```

### Kind 39002: VOIP Contact Status

This event kind is used to broadcast user's VOIP availability status.

```json
{
  "kind": 39002,
  "content": "<status-data>",
  "tags": [
    ["d", "voip-status"],
    ["t", "voip"]
  ]
}
```

Status data examples:
```json
{
  "status": "online|offline|busy|in-call",
  "capabilities": ["audio", "video"],
  "lastSeen": <unix-timestamp>,
  "version": "1.0"
}
```

## Protocol Flow

### 1. Call Initiation

1. **Caller** checks recipient's status via kind 39002 events
2. **Caller** creates WebRTC peer connection with `initiator: true`
3. **Caller** sends kind 39000 event with `type: "offer"` to recipient
4. **Caller** listens for response events from recipient

### 2. Call Acceptance

1. **Recipient** receives offer event
2. **Recipient** creates WebRTC peer connection with `initiator: false`
3. **Recipient** processes the offer SDP
4. **Recipient** sends kind 39000 event with `type: "answer"` to caller
5. **Recipient** listens for ICE candidates and call status

### 3. Call Establishment

1. Both parties exchange ICE candidates via kind 39000 events
2. WebRTC connection establishes peer-to-peer audio stream
3. Both parties periodically send call status updates
4. Audio flows directly between peers (not through Nostr relays)

### 4. Call Termination

1. Either party sends kind 39000 event with `type: "end-call"`
2. Both parties close WebRTC connections
3. Optional: Either party may create kind 39001 event for call history

## Security Considerations

### WebRTC Security

- All audio is encrypted using DTLS-SRTP
- Peer connections are established directly between clients
- No audio data flows through Nostr relays (signaling only)

### Nostr Security

- Signaling messages are signed by the sender's private key
- Recipients can verify message authenticity
- Call IDs prevent replay attacks
- Timestamps help prevent stale message processing

### Privacy Considerations

- Call metadata (caller, callee, duration) is visible on relays
- Audio content remains private between participants
- Users can choose which relays to use for signaling

## Implementation Requirements

### Client Requirements

1. **WebRTC Support**: Must support modern WebRTC APIs
2. **Nostr Integration**: Must be able to publish and subscribe to events
3. **STUN/TURN**: Must support STUN for NAT traversal, TURN for restrictive networks
4. **Error Handling**: Must handle connection failures gracefully
5. **Status Management**: Must update user status appropriately

### Relay Requirements

1. **Event Support**: Must support kind 39000 events
2. **Performance**: Should provide low-latency message delivery
3. **Filtering**: Should support filtering by `#p` tag for efficient signaling

## Configuration

### Default STUN Servers

```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
stun:stun2.l.google.com:19302
```

### Optional TURN Configuration

Clients may configure TURN servers for networks that block direct peer connections:

```
turn:your-turn-server:3478?transport=udp
turn:your-turn-server:3478?transport=tcp
turns:your-turn-server:5349
```

## Extensions

### Future Enhancements

1. **Video Support**: Extend protocol to include video streams
2. **Group Calls**: Support multi-party calls using SFU/MCU architecture
3. **Call Recording**: Secure, encrypted call recording with consent
4. **Call Forwarding**: Automatic call forwarding to other devices/users
5. **Voicemail**: Store voice messages when recipient is unavailable

### Integration with Other NIPs

- **NIP-04/NIP-17**: For encrypted call invitations
- **NIP-47**: For paid calls using Lightning
- **NIP-57**: For zapping during calls
- **NIP-65**: For relay list management optimized for VOIP

## Example Implementation

### Call Flow Example

```javascript
// Caller initiates call
async function initiateCall(recipientPubkey) {
  const peer = new SimplePeer({ initiator: true, trickle: true });
  const callId = generateCallId();
  
  peer.on('signal', async (data) => {
    await publishNostrEvent({
      kind: 39000,
      content: JSON.stringify({
        type: 'offer',
        sdp: data,
        callId,
        timestamp: Date.now()
      }),
      tags: [['p', recipientPubkey]]
    });
  });
  
  // Listen for answer
  subscribeToNostrEvents({
    kinds: [39000],
    '#p': [userPubkey],
    since: Date.now()
  }, (event) => {
    const data = JSON.parse(event.content);
    if (data.callId === callId && data.type === 'answer') {
      peer.signal(data.sdp);
    }
  });
}
```

This protocol enables decentralized, secure voice communication while leveraging Nostr's censorship-resistant properties for signaling.