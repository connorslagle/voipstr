# Nostr VOIP - Start9 Server Deployment Guide

This guide provides detailed instructions for deploying Nostr VOIP on a Start9 Embassy server.

## 🎯 Overview

Nostr VOIP is designed to run seamlessly on Start9 servers with the following benefits:
- **Self-hosted**: Complete control over your VOIP infrastructure
- **Privacy-focused**: No external dependencies or tracking
- **Easy management**: Simple installation through Start9 UI
- **Local network optimized**: Perfect for home/office use
- **Resource efficient**: Optimized for Start9 hardware

## 📋 Prerequisites

- Start9 Embassy server (any model)
- Internet connection for initial setup
- Local network for device communication
- Optional: Domain name for external access

## 🚀 Installation Methods

### Method 1: Start9 Market (Recommended)

1. **Open Start9 Embassy UI**
   - Navigate to your Start9 Embassy web interface
   - Go to "Market" or "App Store"

2. **Search for Nostr VOIP**
   - Search for "Nostr VOIP" or "VOIP"
   - Select the application from the list

3. **Install Application**
   - Click "Install"
   - Configure installation options:
     - **Service Name**: `nostr-voip` (recommended)
     - **Memory Allocation**: `512MB` (minimum)
     - **CPU Cores**: `1` (minimum)
   - Click "Install"

4. **Wait for Installation**
   - Monitor installation progress
   - Service will start automatically

### Method 2: Custom Docker Service

1. **SSH into Start9 Server**
```bash
ssh your-start9-server
```

2. **Create Application Directory**
```bash
mkdir -p ~/apps/nostr-voip
cd ~/apps/nostr-voip
```

3. **Download Application Files**
```bash
# Clone repository
git clone https://github.com/your-username/nostr-voip.git .

# Or download pre-built package
wget https://github.com/your-username/nostr-voip/releases/latest/download/nostr-voip-start9.tar.gz
tar -xzf nostr-voip-start9.tar.gz
```

4. **Create Start9 Service Configuration**
```yaml
# start9-service.yaml
name: nostr-voip
version: "1.0.0"
description: "Decentralized VOIP client over Nostr network"
icon: "https://raw.githubusercontent.com/your-username/nostr-voip/main/icon.png"
ports:
  - web: 8080
  - stun: 3478/udp
  - turn: 5349/tcp
dependencies: []
environment: {}
volumes:
  - data: /data
  - ssl: /ssl
backup:
  - /data
  - /ssl
```

5. **Start Service**
```bash
# Start the service
start9-cli service create start9-service.yaml

# Monitor service status
start9-cli service logs nostr-voip -f
```

### Method 3: Manual Docker Deployment

1. **SSH into Start9 Server**
```bash
ssh your-start9-server
```

2. **Install Docker (if not already installed)**
```bash
# Start9 usually comes with Docker pre-installed
docker --version
```

3. **Create Application Directory**
```bash
mkdir -p ~/apps/nostr-voip
cd ~/apps/nostr-voip
```

4. **Download Docker Compose File**
```bash
wget https://raw.githubusercontent.com/your-username/nostr-voip/main/docker-compose.start9.yml
mv docker-compose.start9.yml docker-compose.yml
```

5. **Start Services**
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## ⚙️ Configuration

### Start9 UI Configuration

1. **Access Service Settings**
   - Open Start9 Embassy UI
   - Go to "Services"
   - Click on "nostr-voip"

2. **Configure Environment Variables**
   ```env
   NODE_ENV=production
   VITE_DEFAULT_RELAY=wss://relay.nostr.band
   VITE_STUN_SERVER=stun:stun.l.google.com:19302
   VITE_LOCAL_DISCOVERY=true
   ```

3. **Network Settings**
   - **Port Configuration**:
     - Web Interface: 8080
     - STUN Server: 3478 (UDP)
     - TURN Server: 5349 (TCP)
   - **Local Network**: Enable for device discovery

### Manual Configuration

1. **Edit Environment File**
```bash
# Create .env file
cat > .env << EOF
NODE_ENV=production
VITE_DEFAULT_RELAY=wss://relay.nostr.band
VITE_STUN_SERVER=stun:stun.l.google.com:19302
VITE_LOCAL_DISCOVERY=true
VITE_START9_MODE=true
EOF
```

2. **Update Docker Compose**
```yaml
# docker-compose.override.yml
version: '3.8'

services:
  voip-app:
    environment:
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

3. **Restart Services**
```bash
docker-compose down
docker-compose up -d
```

## 🔒 Security Configuration

### SSL/TLS Setup

1. **Generate Self-Signed Certificate**
```bash
# Create SSL directory
mkdir -p ssl/certs ssl/private

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private/key.pem \
  -out ssl/certs/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=nostr-voip.local"
```

2. **Configure HTTPS**
```yaml
# docker-compose.ssl.yml
version: '3.8'

services:
  voip-app:
    ports:
      - "8443:443"
    volumes:
      - ./ssl:/etc/ssl:ro
    environment:
      - VITE_HTTPS=true
```

3. **Update Start9 Service**
```bash
# Add HTTPS port to service configuration
# Update start9-service.yaml with:
ports:
  - web: 8080
  - web-secure: 8443
```

### Firewall Configuration

1. **Allow Required Ports**
```bash
# Allow WebRTC ports
sudo ufw allow 3478/udp   # STUN/TURN
sudo ufw allow 5349/tcp   # TURN TLS
sudo ufw allow 8080/tcp   # Web interface
sudo ufw allow 8443/tcp   # Web interface (HTTPS)

# Enable firewall
sudo ufw enable
```

2. **Start9 Firewall Rules**
```bash
# Add rules through Start9 UI or CLI
start9-cli firewall add 3478/udp
start9-cli firewall add 5349/tcp
start9-cli firewall add 8080/tcp
start9-cli firewall add 8443/tcp
```

## 🌐 Network Configuration

### Local Network Access

1. **Enable Local Discovery**
```env
VITE_LOCAL_DISCOVERY=true
VITE_LOCAL_NETWORK=true
```

2. **Find Start9 Server IP**
```bash
# Get server IP
ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1
```

3. **Access from Local Devices**
   - **Phones/Tablets**: http://start9-ip:8080
   - **Computers**: http://start9-ip:8080
   - Ensure all devices are on the same network

### External Access (Optional)

1. **Configure Port Forwarding**
   - Access your router's admin interface
   - Forward ports to Start9 server:
     - Port 8080 (HTTP)
     - Port 8443 (HTTPS)
     - Port 3478 (UDP for STUN/TURN)

2. **Dynamic DNS (Optional)**
   - Sign up for a Dynamic DNS service
   - Configure DDNS client on Start9 or router
   - Update domain to point to your IP

3. **Domain Configuration**
```yaml
# docker-compose.domain.yml
version: '3.8'

services:
  voip-app:
    environment:
      - VITE_DOMAIN=your-domain.com
      - VITE_HTTPS=true
```

## 📱 Device Setup

### Mobile Devices

1. **Connect to Local Network**
   - Ensure mobile device is on the same WiFi as Start9 server
   - Open browser and navigate to http://start9-ip:8080

2. **Install as Web App**
   - In Chrome/Safari: "Add to Home Screen"
   - Create a shortcut for quick access
   - Works offline for cached content

3. **Microphone Permissions**
   - Grant microphone access when prompted
   - Ensure browser has necessary permissions

### Desktop Devices

1. **Web Browser Access**
   - Navigate to http://start9-ip:8080
   - Bookmark for easy access
   - Enable desktop notifications

2. **Electron App (Optional)**
```bash
# Install Electron wrapper (if available)
npm install -g electron-packager

# Package as desktop app
electron-packager . NostrVOIP --platform=linux --arch=x64
```

### VoIP Hardware

1. **USB Microphones**
   - Connect USB microphone to Start9 server
   - Configure in application settings
   - Test audio input/output

2. **Audio Devices**
   - Use USB audio interface for better quality
   - Configure system audio settings
   - Test with WebRTC tools

## 🔄 Updates and Maintenance

### Automatic Updates

1. **Enable Auto-Updates**
```yaml
# start9-service.yaml
updates:
  auto: true
  schedule: "0 2 * * *"  # Daily at 2 AM
```

2. **Manual Updates via Start9 UI**
   - Go to "Services"
   - Click "Update" for Nostr VOIP
   - Monitor update progress

### Manual Updates

1. **SSH into Server**
```bash
ssh your-start9-server
cd ~/apps/nostr-voip
```

2. **Update Application**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

3. **Update Docker Images**
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### Backup and Restore

1. **Start9 Backup**
   - Use Start9's built-in backup system
   - Schedule regular backups
   - Test restore process

2. **Manual Backup**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
tar -czf backup-$(date +%Y%m%d).tar.gz \
  data/ ssl/ docker-compose.yml .env
EOF

chmod +x backup.sh
./backup.sh
```

3. **Restore from Backup**
```bash
# Stop services
docker-compose down

# Restore backup
tar -xzf backup-20231201.tar.gz

# Restart services
docker-compose up -d
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
docker-compose logs voip-app

# Check Start9 service status
start9-cli service status nostr-voip

# Check resource usage
docker stats
```

#### 2. WebRTC Not Connecting

```bash
# Check STUN server
nc -z localhost 3478

# Check TURN server
nc -z localhost 5349

# Test WebRTC connectivity
curl -f http://localhost:8080/health
```

#### 3. Local Network Issues

```bash
# Check network interface
ip addr show

# Check firewall rules
sudo ufw status

# Test local connectivity
ping start9-ip
```

#### 4. SSL/TLS Issues

```bash
# Check certificate
openssl x509 -in ssl/certs/cert.pem -text -noout

# Test HTTPS connection
curl -k https://localhost:8443/health
```

### Performance Optimization

1. **Resource Allocation**
```yaml
# docker-compose.optimized.yml
version: '3.8'

services:
  voip-app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

2. **Network Optimization**
```yaml
networks:
  start9-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

3. **Logging Configuration**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Monitoring

1. **Start9 Monitoring**
   - Use Start9's built-in monitoring
   - Check service health status
   - Monitor resource usage

2. **Custom Monitoring**
```bash
# Health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
  echo "Service is healthy"
  exit 0
else
  echo "Service is unhealthy"
  exit 1
fi
EOF

chmod +x health-check.sh
./health-check.sh
```

3. **Log Analysis**
```bash
# View recent logs
docker-compose logs --tail=100 voip-app

# Follow logs
docker-compose logs -f voip-app

# Error logs only
docker-compose logs voip-app 2>&1 | grep ERROR
```

## 📚 Advanced Configuration

### TURN Server Configuration

1. **Production TURN Setup**
```ini
# turnserver.conf
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=your-strong-secret
realm=nostr-voip.local
user=turn-user:turn-password
```

2. **Docker Compose for TURN**
```yaml
# docker-compose.turn.yml
version: '3.8'

services:
  turn-server:
    image: instrumentisto/coturn:latest
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
      - "5349:5349/tcp"
      - "5349:5349/udp"
    volumes:
      - ./turnserver.conf:/etc/coturn/turnserver.conf
    environment:
      - TURN_USERNAME=turn-user
      - TURN_CREDENTIAL=turn-password
    restart: unless-stopped
```

### Redis Caching

1. **Add Redis for Caching**
```yaml
# docker-compose.redis.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  voip-app:
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
```

### Load Balancing

1. **Nginx Load Balancer**
```yaml
# docker-compose.lb.yml
version: '3.8'

services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
      - ssl:/etc/ssl:ro
    depends_on:
      - voip-app
    restart: unless-stopped
```

2. **Load Balancer Configuration**
```nginx
# nginx-lb.conf
upstream voip_backend {
    server voip-app:8080;
}

server {
    listen 80;
    server_name localhost;
    location / {
        proxy_pass http://voip_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🎉 Success!

Your Nostr VOIP application is now running on Start9 server!

### Next Steps:
1. **Test the application**: Open http://start9-ip:8080
2. **Configure devices**: Connect phones, tablets, and computers
3. **Test calls**: Make test calls between devices
4. **Monitor performance**: Check logs and resource usage
5. **Set up backups**: Configure regular backup schedule

### Access Points:
- **Web Interface**: http://start9-ip:8080
- **Health Check**: http://start9-ip:8080/health
- **Start9 UI**: Your Start9 Embassy web interface
- **SSH**: ssh your-start9-server

### Support:
- **Start9 Documentation**: https://start9.com/docs
- **Nostr VOIP Issues**: GitHub repository issues
- **Community**: Nostr community channels

---

For additional help and configuration options, refer to the main documentation or create an issue on the GitHub repository.