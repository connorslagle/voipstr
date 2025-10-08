#!/bin/bash

# Production Deployment Script for Nostr VOIP
# This script handles the complete production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="nostr-voip"
REGISTRY="docker.io"
IMAGE_TAG="latest"
COMPOSE_FILE="docker-compose.prod.yml"

# Functions
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

# Pre-deployment checks
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Production compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Build application
build_application() {
    print_status "Building application..."
    
    # Build with no cache for production
    docker build -t ${REGISTRY}/${PROJECT_NAME}:${IMAGE_TAG} --no-cache .
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Application build failed"
        exit 1
    fi
}

# Create necessary directories and files
setup_environment() {
    print_status "Setting up production environment..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p ssl/certs ssl/private
    
    # Generate SSL certificate if not exists
    if [ ! -f ssl/certs/cert.pem ] || [ ! -f ssl/private/key.pem ]; then
        print_warning "SSL certificates not found. Generating self-signed certificates..."
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/private/key.pem \
            -out ssl/certs/cert.pem \
            -subj "/C=US/ST=CA/L=San Francisco/O=Nostr VOIP/CN=localhost" \
            2>/dev/null
        
        print_success "Self-signed SSL certificate generated"
        print_warning "For production, use proper SSL certificates from Let's Encrypt"
    fi
    
    # Create environment file if not exists
    if [ ! -f .env ]; then
        print_warning "Environment file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please update .env file with your production settings"
    fi
    
    # Create logs directory
    mkdir -p logs/nginx logs/turnserver logs/app
    
    print_success "Environment setup completed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if Redis is used and run migrations if needed
    if grep -q "redis:" "$COMPOSE_FILE"; then
        print_status "Redis service detected. Checking status..."
        
        # Wait for Redis to be ready
        docker-compose -f "$COMPOSE_FILE" up -d redis
        
        # Check Redis connection
        timeout 30 sh -c 'until docker-compose -f nostr-voip/docker-compose.prod.yml exec -T redis redis-cli ping; do sleep 1; done'
        
        if [ $? -eq 0 ]; then
            print_success "Redis is ready"
        else
            print_warning "Redis connection timeout, continuing anyway"
        fi
    fi
}

# Start services
start_services() {
    print_status "Starting production services..."
    
    # Stop existing services
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # Start services with detached mode
    docker-compose -f "$COMPOSE_FILE" up --build -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Health checks
health_checks() {
    print_status "Running health checks..."
    
    # Wait for services to be healthy
    local services=("voip-app" "redis" "turn-server")
    local max_attempts=30
    local attempt=1
    
    for service in "${services[@]}"; do
        print_status "Checking health of $service..."
        
        while [ $attempt -le $max_attempts ]; do
            if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q "${service}.*healthy"; then
                print_success "$service is healthy"
                break
            else
                if [ $attempt -eq $max_attempts ]; then
                    print_warning "$service health check timed out"
                else
                    echo "Attempt $attempt/$max_attempts..."
                    sleep 2
                    ((attempt++))
                fi
            fi
        done
        attempt=1
    done
}

# Run post-deployment tests
run_tests() {
    print_status "Running post-deployment tests..."
    
    # Test application endpoint
    if curl -f -k https://localhost:8443/health > /dev/null 2>&1; then
        print_success "Application health check passed"
    else
        print_warning "Application health check failed"
    fi
    
    # Test TURN server
    if nc -z localhost 3478; then
        print_success "TURN server is accessible"
    else
        print_warning "TURN server may not be accessible"
    fi
    
    # Test Redis
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is responding"
    else
        print_warning "Redis may not be responding"
    fi
}

# Show deployment info
show_deployment_info() {
    print_success "Deployment completed successfully!"
    echo ""
    echo "🎯 Deployment Information:"
    echo "========================"
    echo ""
    echo "🌐 Application URLs:"
    echo "   HTTP:  http://localhost:8080"
    echo "   HTTPS: https://localhost:8443"
    echo "   Health: https://localhost:8443/health"
    echo ""
    echo "🔧 Service Ports:"
    echo "   VOIP App: 8080 (HTTP), 8443 (HTTPS)"
    echo "   Redis: 6379"
    echo "   TURN Server: 3478 (UDP/TCP), 5349 (TLS)"
    echo ""
    echo "📊 Monitoring Commands:"
    echo "   View logs:    docker-compose -f $COMPOSE_FILE logs -f"
    echo "   Service status: docker-compose -f $COMPOSE_FILE ps"
    echo "   Stop services: docker-compose -f $COMPOSE_FILE down"
    echo ""
    echo "🔒 Security Notes:"
    echo "   - SSL certificates are self-signed (for testing only)"
    echo "   - For production, use proper SSL certificates"
    echo "   - TURN credentials are in .env file"
    echo "   - Firewall rules may need adjustment"
    echo ""
    echo "⚠️  Next Steps:"
    echo "   1. Update .env file with your production settings"
    echo "   2. Configure proper SSL certificates"
    echo "   3. Set up domain and DNS records"
    echo "   4. Configure firewall rules"
    echo "   5. Set up monitoring and logging"
}

# Main deployment function
main() {
    echo "🚀 Nostr VOIP Production Deployment"
    echo "=================================="
    echo ""
    
    check_prerequisites
    build_application
    setup_environment
    run_migrations
    start_services
    health_checks
    run_tests
    show_deployment_info
    
    echo ""
    print_success "Production deployment is complete!"
}

# Handle script arguments
case "${1:-}" in
    "build-only")
        check_prerequisites
        build_application
        print_success "Build completed. Use './deploy.sh' to deploy."
        ;;
    "setup-only")
        setup_environment
        print_success "Environment setup completed."
        ;;
    "test-only")
        run_tests
        ;;
    *)
        main "$@"
        ;;
esac