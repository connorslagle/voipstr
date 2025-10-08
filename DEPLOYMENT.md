# Nostr VOIP - Deployment Guide

This guide covers deploying the Nostr VOIP application in various environments using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git (for cloning repository)
- Port 8080 available (or custom port)

### 1-Click Deployment

```bash
# Clone repository
git clone https://github.com/your-username/nostr-voip.git
cd nostr-voip

# Run setup script
./scripts/docker-setup.sh

# Start production
docker-compose up --build -d
```

Access: http://localhost:8080

## 🐳 Docker Deployment Options

### Option 1: Production (Recommended)

```bash
# Production build with optimized nginx
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Features:**
- Optimized nginx web server
- Production build with minification
- Health checks and monitoring
- Security headers and CORS
- Gzip compression

### Option 2: Development

```bash
# Development with hot-reload
docker-compose -f docker-compose.dev.yml up --build

# Access: http://localhost:5173
# Includes: Nostr relay, TURN server
```

**Features:**
- Hot module replacement (HMR)
- Development server with source maps
- Local Nostr relay for testing
- Local TURN server for development
- React DevTools integration

### Option 3: Full Stack (Redis + TURN)

```bash
# Production with Redis cache and TURN server
docker-compose --profile redis --profile turn up --build -d
```

**Services:**
- VOIP application (port 8080)
- Redis cache (port 6379)
- TURN/STUN server (ports 3478, 5349)

## 🏠 Local Network Deployment

Perfect for home/office networks where multiple devices need to communicate.

### Setup

```bash
# Build for local network
docker build -t nostr-voip:local .

# Run on local machine
docker run -d \
  --name nostr-voip-local \
  -p 8080:8080 \
  -e VITE_DEFAULT_RELAY=wss://relay.nostr.band \
  -e VITE_LOCAL_DISCOVERY=true \
  nostr-voip:local
```

### Access from Other Devices

1. **Find your local IP:**
```bash
ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1
```

2. **Access from other devices:**
   - Phone/Tablet: http://YOUR_LOCAL_IP:8080
   - Ensure all devices are on the same network

### Network Requirements

- **Same subnet:** All devices must be on the same network
- **Firewall:** Allow port 8080 (or custom port)
- **WebRTC:** Works best on local networks without NAT restrictions

## 🖥️ Start9 Server Deployment

Optimized for Start9 Embassy OS with service integration.

### Method 1: Docker Compose (Recommended)

```bash
# SSH into Start9 server
ssh your-start9-server

# Clone repository
git clone https://github.com/your-username/nostr-voip.git
cd nostr-voip

# Setup and start
./scripts/docker-setup.sh
docker-compose up --build -d
```

### Method 2: Start9 Service Integration

1. **Build image locally:**
```bash
docker build -t nostr-voip:start9 .
```

2. **Push to Start9 registry:**
```bash
docker tag nostr-voip:start9 start9-registry:5000/nostr-voip:latest
docker push start9-registry:5000/nostr-voip:latest
```

3. **Configure in Start9 UI:**
   - Go to Services → Add Service
   - Select "Custom Docker Image"
   - Image: `start9-registry:5000/nostr-voip:latest`
   - Port mapping: `8080`
   - Environment variables as needed

### Start9 Specific Configuration

```yaml
# docker-compose.override.yml for Start9
version: '3.8'

services:
  voip-app:
    environment:
      - NODE_ENV=production
      - VITE_DEFAULT_RELAY=wss://relay.nostr.band
      - VITE_START9_MODE=true
      - VITE_LOCAL_DISCOVERY=true
    volumes:
      - /var/start9/data/nostr-voip:/data
    restart: unless-stopped
    networks:
      - start9-network

networks:
  start9-network:
    external: true
```

## 🔧 Environment Configuration

### Production Environment

```bash
# Production with custom relay
docker-compose up --build -d \
  -e NODE_ENV=production \
  -e VITE_DEFAULT_RELAY=wss://your-relay.com \
  -e VITE_STUN_SERVER=stun:your-stun.com:19302 \
  -e VITE_TURN_SERVER=turn:your-turn.com:3478 \
  -e VITE_TURN_USERNAME=your-user \
  -e VITE_TURN_CREDENTIAL=your-secret
```

### Development Environment

```bash
# Development with local services
docker-compose -f docker-compose.dev.yml up --build \
  -e VITE_DEV_MODE=true \
  -e VITE_HOT_RELOAD=true \
  -e VITE_DEFAULT_RELAY=ws://nostr-relay:7777
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | No |
| `VITE_DEFAULT_RELAY` | Default Nostr relay | `wss://relay.nostr.band` | Yes |
| `VITE_STUN_SERVER` | STUN server for WebRTC | `stun:stun.l.google.com:19302` | Yes |
| `VITE_TURN_SERVER` | TURN server (optional) | - | No |
| `VITE_TURN_USERNAME` | TURN username | - | No |
| `VITE_TURN_CREDENTIAL` | TURN password | - | No |
| `VITE_LOCAL_DISCOVERY` | Local network discovery | `false` | No |
| `VITE_ENABLE_RECORDING` | Enable call recording | `false` | No |

## 🔒 Security Configuration

### HTTPS Setup (Required for WebRTC)

#### Production with Let's Encrypt

```bash
# 1. Stop service
docker-compose down

# 2. Create SSL directory
mkdir -p ssl/certs ssl/private

# 3. Request certificate (Certbot)
certbot certonly --standalone -d your-domain.com --email your-email@example.com --agree-tos

# 4. Copy certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/certs/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/private/key.pem

# 5. Update nginx.conf for SSL
# (See nginx.ssl.conf example)

# 6. Restart with SSL
docker-compose up --build -d
```

#### Self-Signed SSL (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private/key.pem \
  -out ssl/certs/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Use with Docker
docker run -d \
  -v $(pwd)/ssl:/etc/ssl \
  -p 8443:443 \
  nostr-voip:latest
```

### Firewall Configuration

```bash
# Allow WebRTC ports (UDP)
sudo ufw allow 3478/udp   # STUN/TURN
sudo ufw allow 10000:20000/udp  # TURN media range

# Allow application ports
sudo ufw allow 8080/tcp   # HTTP
sudo ufw allow 8443/tcp   # HTTPS

# Enable firewall
sudo ufw enable
```

### Docker Security

```bash
# Run as non-root user
docker run -u 1001:1001 ...

# Read-only filesystem
docker run --read-only ...

# Drop capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE ...

# Resource limits
docker run --memory=512m --cpus=1.0 ...
```

## 🔧 TURN Server Configuration

### Production TURN Server

```yaml
# docker-compose.override.yml
version: '3.8'

services:
  turn-server:
    image: instrumentisto/coturn:latest
    container_name: nostr-voip-turn-prod
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
      - "5349:5349/tcp"
      - "5349:5349/udp"
      - "49152-65535:49152-65535/udp"
    volumes:
      - ./turn-prod.conf:/etc/coturn/turnserver.conf
      - ./ssl:/etc/ssl
    environment:
      - TURN_USERNAME=prod-user
      - TURN_CREDENTIAL=prod-secret
      - REALM=nostr-voip.com
    restart: unless-stopped
    networks:
      - voip-network
```

### TURN Configuration File

```ini
# turn-prod.conf
listening-port=3478
listening-ip=0.0.0.0
tls-listening-port=5349
tls-cert-file=/etc/ssl/certs/cert.pem
tls-key-file=/etc/ssl/private/key.pem

fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=your-strong-secret
realm=nostr-voip.com

userdb=/var/lib/turn/turndb
no-loopback-peers
no-multicast-peers

log-file=/var/log/turnserver/turn.log
syslog
simple-log

no-cli
pidfile=/var/run/turnserver/turnserver.pid

user=turnuser
group=turnuser

mobility

# Production settings
no-tlsv1
no-tlsv1_1
no-tlsv1_2

# Allow only authenticated users
# no-auth
user=prod-user:prod-secret
```

## 📊 Monitoring and Logging

### Health Checks

```bash
# Application health
curl http://localhost:8080/health

# Docker health
docker ps --filter "health=healthy"

# Service status
docker-compose ps
```

### Log Management

```bash
# View all logs
docker-compose logs

# Follow specific service
docker-compose logs -f voip-app

# Logs since specific time
docker-compose logs --since 1h

# Export logs
docker-compose logs > app.log 2>&1
```

### Monitoring Setup

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring-network

networks:
  monitoring-network:
    driver: bridge

volumes:
  grafana_data:
```

## 🔄 Updates and Maintenance

### Rolling Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d --force-recreate

# Clean old images
docker image prune -f
```

### Backup and Restore

```bash
# Backup data
docker run --rm \
  -v $(pwd)/backup:/backup \
  -v nostr_voip_data:/data \
  alpine:latest \
  tar czf /backup/nostr-voip-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore from backup
docker run --rm \
  -v $(pwd)/backup:/backup \
  -v nostr_voip_data:/data \
  alpine:latest \
  tar xzf /backup/nostr-voip-backup-20231201.tar.gz -C /data
```

### Database Migration

```bash
# For Redis cache (if used)
docker exec nostr-voip-redis redis-cli SAVE

# Backup Redis data
docker cp nostr-voip-redis:/data/dump.rdb ./redis-backup.rdb

# Restore Redis data
docker cp ./redis-backup.rdb nostr-voip-redis:/data/dump.rdb
docker restart nostr-voip-redis
```

## 🚨 Troubleshooting

### Common Issues

#### 1. WebRTC Not Connecting

```bash
# Check STUN/TURN server status
docker-compose logs turn-server

# Test STUN server
stunclient stun:stun.l.google.com:19302

# Check network connectivity
docker exec voip-app curl -f http://localhost:8080/health

# Verify TURN credentials
echo "your-username:your-secret" | base64
```

#### 2. High CPU/Memory Usage

```bash
# Monitor resource usage
docker stats

# Check container limits
docker inspect voip-app | grep -A 10 "HostConfig"

# Adjust resource limits
docker-compose up --build -d \
  --memory=1g \
  --cpus=2.0
```

#### 3. SSL/TLS Issues

```bash
# Verify certificate
openssl x509 -in ssl/certs/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect localhost:8443 -showcerts

# Check certificate expiration
openssl x509 -enddate -noout -in ssl/certs/cert.pem
```

#### 4. Docker Networking Issues

```bash
# Inspect network
docker network inspect nostr-voip-network

# Check container IP
docker inspect voip-app | grep IPAddress

# Test connectivity between containers
docker exec voip-app ping nostr-relay
```

### Performance Optimization

```bash
# Enable Docker build cache
docker build --no-cache=false -t nostr-voip:latest .

# Use multi-stage builds
# (Already implemented in Dockerfile)

# Optimize layer ordering
# (Already optimized in Dockerfile)

# Use .dockerignore
# (Already created)
```

### Security Hardening

```bash
# Scan for vulnerabilities
docker scan nostr-voip:latest

# Update base images
docker pull node:18-alpine
docker pull nginx:alpine

# Use non-root images
# (Already implemented)

# Limit container capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE
```

## 📚 Additional Resources

### Documentation
- [WebRTC Documentation](https://webrtc.org/)
- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)

### Support
- [WebRTC Troubleshooting](https://webrtc.org/getting-started/troubleshooting)
- [Docker Community](https://forums.docker.com/)
- [Nostr Community](https://discord.gg/nostr)

### Tools
- [WebRTC Samples](https://github.com/webrtc/samples)
- [TURN Test](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/test/)
- [Docker Compose Validate](https://github.com/pvdlg/docker-compose-yaml-validate)

---

This deployment guide covers the most common scenarios for deploying Nostr VOIP in production, development, and local network environments.