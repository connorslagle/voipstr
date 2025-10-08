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

### Quick Start with Docker

The easiest way to get started is using Docker:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/nostr-voip.git
cd nostr-voip

# 2. Run setup script
./scripts/docker-setup.sh

# 3. Start development environment
docker-compose -f docker-compose.dev.yml up --build

# OR start production environment
docker-compose up --build -d
```

### Docker Deployment Options

#### Development Environment
```bash
# Development with hot-reload and local services
docker-compose -f docker-compose.dev.yml up --build

# Access: http://localhost:5173
# Includes: Nostr relay (ws://localhost:7777), TURN server
```

#### Production Environment
```bash
# Production with optimized build
docker-compose up --build -d

# Access: http://localhost:8080
# Health check: http://localhost:8080/health
```

#### With Optional Services
```bash
# Production with Redis cache and TURN server
docker-compose --profile redis --profile turn up --build -d
```

### Docker Compose Services

| Service | Port | Description | Profile |
|----------|-------|-------------|---------|
| voip-app | 8080 | Main VOIP application | Default |
| redis | 6379 | Redis cache (optional) | redis |
| turn-server | 3478/udp, 5349/tcp | TURN/STUN server (optional) | turn |
| nostr-relay | 7777 | Local Nostr relay (dev only) | relay |

### Start9 Server

This application is designed to run well on Start9 servers:

1. **Using Docker (recommended)**:
```bash
# Build and run on Start9
docker-compose up --build -d

# Configure through Start9 UI
# Access via Start9 service proxy
```

2. **Manual deployment**:
```bash
# Build the application
npm run build
```

3. **Serve with a web server** (nginx example):
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

4. **Configure HTTPS** (required for WebRTC):
- Use Let's Encrypt or other SSL certificate
- WebRTC will not work on HTTP (except localhost)

### Manual Docker Build

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
# Application Settings
NODE_ENV=development
VITE_APP_NAME=Nostr VOIP
VITE_APP_VERSION=1.0.0

# Nostr Configuration
VITE_DEFAULT_RELAY=wss://relay.nostr.band
VITE_FOLLOWS_RELAY=wss://relay.damus.io

# WebRTC Configuration
VITE_STUN_SERVER=stun:stun.l.google.com:19302
VITE_TURN_SERVER=turn:your-turn-server:3478
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-credential

# Docker Settings (optional)
COMPOSE_PROJECT_NAME=nostr-voip
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

### Docker Environment Variables

When using Docker, you can override environment variables:

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build \
  -e VITE_DEFAULT_RELAY=ws://nostr-relay:7777 \
  -e VITE_STUN_SERVER=stun:stun.l.google.com:19302

# Production
docker-compose up --build -d \
  -e NODE_ENV=production \
  -e VITE_DEFAULT_RELAY=wss://relay.nostr.band
```

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

## Docker Development

### Development Setup

```bash
# 1. Clone and setup
git clone https://github.com/your-username/nostr-voip.git
cd nostr-voip
./scripts/docker-setup.sh

# 2. Development with hot-reload
docker-compose -f docker-compose.dev.yml up --build

# 3. Access application
# Frontend: http://localhost:5173
# Nostr Relay: ws://localhost:7777
# TURN Server: turn:localhost:3478
```

### Production Build

```bash
# Build production image
docker build -t nostr-voip:latest .

# Test production container
docker run -p 8080:8080 --rm nostr-voip:latest

# Or use docker-compose
docker-compose up --build -d
```

### Docker Commands Cheat Sheet

```bash
# Build and start development
docker-compose -f docker-compose.dev.yml up --build

# Start production services
docker-compose up --build -d

# View logs
docker-compose logs -f voip-app

# Stop all services
docker-compose down

# Remove volumes (complete reset)
docker-compose down -v

# Clean up unused images
docker image prune -f

# Access container shell
docker exec -it nostr-voip-app sh

# Check service health
curl http://localhost:8080/health
```

### Local Network Deployment

For local network usage (phones, tablets, computers on same network):

```bash
# 1. Build application
docker build -t nostr-voip:local .

# 2. Run on local machine
docker run -d \
  --name nostr-voip-local \
  -p 8080:8080 \
  -e VITE_DEFAULT_RELAY=wss://relay.nostr.band \
  nostr-voip:local

# 3. Find your local IP
ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1

# 4. Access from other devices
# http://your-local-ip:8080
```

### Start9 Server Deployment

For Start9 server deployment:

```bash
# 1. SSH into Start9 server
ssh your-start9-server

# 2. Clone repository
git clone https://github.com/your-username/nostr-voip.git
cd nostr-voip

# 3. Setup and start
./scripts/docker-setup.sh
docker-compose up --build -d

# 4. Configure through Start9 UI
# Add as web service with port 8080
```

### Docker Compose Profiles

Use profiles to start specific services:

```bash
# Development only (app + relay + TURN)
docker-compose -f docker-compose.dev.yml up --build

# Production only (app only)
docker-compose up --build -d

# Production with Redis cache
docker-compose --profile redis up --build -d

# Production with TURN server
docker-compose --profile turn up --build -d

# All services
docker-compose --profile redis --profile turn up --build -d
```

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