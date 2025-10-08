#!/bin/bash

# Docker Setup Script for Nostr VOIP
# This script helps set up Docker environment for development and production

set -e

echo "🚀 Nostr VOIP Docker Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."

    mkdir -p ssl/certs
    mkdir -p ssl/private
    mkdir -p logs/nginx
    mkdir -p data/redis
    mkdir -p data/nostr-relay

    print_success "Directories created"
}

# Generate self-signed SSL certificate for TURN server
generate_ssl() {
    print_status "Generating self-signed SSL certificate for TURN server..."

    if [ ! -f ssl/certs/cert.pem ] || [ ! -f ssl/private/key.pem ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/private/key.pem \
            -out ssl/certs/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=nostr-voip.local"

        print_success "SSL certificate generated"
    else
        print_warning "SSL certificate already exists"
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment file..."

    cat > .env << EOF
# Nostr VOIP Environment Variables
# ===================================

# Application Settings
NODE_ENV=development
VITE_APP_NAME=Nostr VOIP
VITE_APP_VERSION=1.0.0

# Nostr Configuration
VITE_DEFAULT_RELAY=wss://relay.nostr.band
VITE_FOLLOWS_RELAY=wss://relay.damus.io

# WebRTC Configuration
VITE_STUN_SERVER=stun:stun.l.google.com:19302
VITE_TURN_SERVER=turn:localhost:3478
VITE_TURN_USERNAME=voip-user
VITE_TURN_CREDENTIAL=voip-secret

# Docker Configuration
COMPOSE_PROJECT_NAME=nostr-voip
COMPOSE_FILE=docker-compose.yml

# Development Settings (uncomment for development)
# VITE_DEV_MODE=true
# VITE_HOT_RELOAD=true
EOF

    print_success "Environment file created"
}

# Set proper permissions
set_permissions() {
    print_status "Setting proper permissions..."

    chmod 755 ssl/certs
    chmod 755 ssl/private
    chmod 644 ssl/certs/cert.pem
    chmod 600 ssl/private/key.pem
    chmod 755 scripts/docker-setup.sh

    print_success "Permissions set"
}

# Main setup function
main() {
    print_status "Starting Docker setup for Nostr VOIP..."

    check_docker
    create_directories
    generate_ssl
    create_env_file
    set_permissions

    echo ""
    print_success "Docker setup completed!"
    echo ""
    echo "🎯 Next Steps:"
    echo "============"
    echo ""
    echo "🚀 Development:"
    echo "  docker-compose -f docker-compose.dev.yml up --build"
    echo ""
    echo "🏭 Production:"
    echo "  docker-compose up --build -d"
    echo ""
    echo "📊 View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "  docker-compose down"
    echo ""
    echo "🔧 Access application:"
    echo "  Development: http://localhost:5173"
    echo "  Production: http://localhost:8080"
    echo ""
    print_warning "Don't forget to update .env file with your actual configuration!"
}

# Run main function
main "$@"