# Nostr VOIP

A decentralized voice over IP (VOIP) client built on the Nostr network. Make secure, peer-to-peer voice calls using WebRTC with Nostr for signaling.

## Features

- 🎙️ **WebRTC-powered** high-quality audio calls
- 🔒 **End-to-end encrypted** peer-to-peer connections
- 🌐 **Nostr signaling** - no central servers required
- 👥 **Contact-based** calling using Nostr pubkeys
- 📱 **Responsive design** works on desktop and mobile
- 🏠 **Self-hostable** perfect for Start9 and local networks
- 🎯 **Call quality monitoring** with real-time metrics
- 📞 **Call history** and missed call notifications
- ⚙️ **Comprehensive settings** for audio, network, and privacy

## Architecture

### Protocol Overview

Nostr VOIP uses a hybrid approach:
- **WebRTC** for peer-to-peer audio streaming (encrypted, low-latency)
- **Nostr** for signaling (censorship-resistant, decentralized)

This follows similar trade-offs to zap.stream, using Nostr for coordination while keeping the actual media traffic peer-to-peer.

### Event Kinds

- **Kind 39000**: VOIP signaling (offers, answers, ICE candidates)
- **Kind 39001**: Call log (optional, for history)
- **Kind 39002**: Contact status (online/offline/busy)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser with WebRTC support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/nostr-voip.git
cd nostr-voip
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### Making Your First Call

1. **Login with Nostr**: Use your existing Nostr account or create a new one
2. **Add Contacts**: Follow people on Nostr to see them in your contacts list
3. **Make a Call**: Click the call button next to any contact
4. **Answer Calls**: Incoming calls will show a full-screen interface

### Key Features

#### Contacts Management
- View your Nostr follows as VOIP contacts
- See online/offline/busy status in real-time
- Quick call buttons for each contact

#### Call Interface
- Full-screen call interface with large controls
- Real-time call duration timer
- Mute/unmute functionality
- Speaker/audio output control
- Call quality indicators

#### Settings
- **Audio Settings**: Choose microphone and speakers
- **Network Settings**: Configure STUN/TURN servers
- **Call Settings**: Auto-answer, notifications, recording
- **Privacy Settings**: Contacts-only calls, blocking

#### Call History
- View all incoming, outgoing, and missed calls
- Call back directly from history
- See call duration and timestamps

## Deployment

### Start9 Server

This application is designed to run well on Start9 servers:

1. **Build the application**:
```bash
npm run build
```

2. **Serve with a web server** (nginx example):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # WebRTC requires HTTPS and specific headers
    location / {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    }
}
```

3. **Configure HTTPS** (required for WebRTC):
- Use Let's Encrypt or other SSL certificate
- WebRTC will not work on HTTP (except localhost)

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Local Network Deployment

For local network usage (phones, tablets, computers):

1. Build the application
2. Serve from a local machine
3. Access via `http://local-ip:port` from other devices
4. Ensure devices are on the same network for optimal WebRTC performance

## Configuration

### Environment Variables

Create a `.env` file for configuration:

```env
VITE_DEFAULT_RELAY=wss://relay.nostr.band
VITE_STUN_SERVER=stun:stun.l.google.com:19302
VITE_TURN_SERVER=turn:your-turn-server:3478
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-credential
```

### Custom Relays

The application works best with relays that support:
- Low-latency message delivery
- High availability
- Support for custom event kinds (39000+)

Recommended relays:
- `wss://relay.nostr.band`
- `wss://relay.damus.io`
- `wss://nos.lol`

## Technical Details

### WebRTC Stack

- **SimplePeer**: Simplified WebRTC wrapper
- **WebRTC Adapter**: Browser compatibility shim
- **STUN/TURN**: NAT traversal and fallback
- **DTLS-SRTP**: Media encryption

### Nostr Integration

- **Nostrify**: Modern Nostr client library
- **NIP-07**: Browser signer integration
- **Custom Kinds**: 39000-39002 for VOIP signaling
- **Query Optimization**: Efficient filtering for signaling messages

### Security

- **End-to-end encryption** via WebRTC DTLS-SRTP
- **Nostr message signing** for authentication
- **No audio on relays** - signaling only
- **Optional TURN servers** for restrictive networks

## Future Roadmap

### Near Term
- [ ] Video call support
- [ ] Call recording (local storage)
- [ ] Group calls (SFU-based)
- [ ] Voicemail functionality
- [ ] Call transfer/forwarding

### Long Term
- [ ] LLM secretary integration for call screening
- [ ] Automatic transcription
- [ ] Call analytics and insights
- [ ] Integration with other Nostr apps
- [ ] Mobile app (React Native)

### LLM Secretary Vision

The ultimate goal includes an AI-powered secretary that can:
- Screen incoming calls based on caller importance
- Take messages and schedule callbacks
- Forward calls to appropriate local devices
- Provide call summaries and transcriptions
- Integrate with calendar and contact management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use the existing component patterns
- Test thoroughly across browsers
- Update documentation as needed
- Respect the existing code style

## Testing

```bash
# Run all tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Troubleshooting

### Common Issues

**Calls not connecting:**
- Check STUN/TURN server configuration
- Ensure both users are on compatible networks
- Verify relay connectivity and event delivery

**Poor audio quality:**
- Check network bandwidth and latency
- Try different audio input/output devices
- Verify no other applications are using the microphone

**Nostr relay issues:**
- Try different relays in settings
- Check relay status and availability
- Verify event publishing permissions

### Debug Mode

Enable debug logging in browser console:
```javascript
localStorage.setItem('debug', 'nostr-voip:*');
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Nostr Protocol**: For the decentralized messaging foundation
- **WebRTC**: For peer-to-peer real-time communication
- **SimplePeer**: For the excellent WebRTC wrapper
- **zap.stream**: For pioneering WebRTC + Nostr integration patterns
- **MKStack**: For the excellent development framework

Built with ❤️ using Nostr and WebRTC. [Vibed with MKStack](https://soapbox.pub/mkstack)