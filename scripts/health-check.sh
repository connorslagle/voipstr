#!/bin/bash

# Health Check Script for Nostr VOIP
# This script performs comprehensive health checks on all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
HEALTH_URL="http://localhost:8080/health"
TIMEOUT=30

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

# Check if services are running
check_services_running() {
    print_status "Checking if services are running..."
    
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        print_error "No services are running"
        exit 1
    fi
    
    print_success "Services are running"
}

# Check application health endpoint
check_application_health() {
    print_status "Checking application health endpoint..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + TIMEOUT))
    
    while [ $(date +%s) -lt $end_time ]; do
        if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
            print_success "Application health check passed"
            return 0
        fi
        sleep 2
    done
    
    print_error "Application health check failed after $TIMEOUT seconds"
    return 1
}

# Check Docker service health
check_docker_health() {
    print_status "Checking Docker service health..."
    
    local services=("voip-app" "redis" "turn-server")
    local unhealthy_services=()
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q "${service}.*healthy"; then
            print_success "$service is healthy"
        else
            print_warning "$service is not healthy"
            unhealthy_services+=("$service")
        fi
    done
    
    if [ ${#unhealthy_services[@]} -gt 0 ]; then
        print_error "Unhealthy services: ${unhealthy_services[*]}"
        return 1
    fi
    
    print_success "All Docker services are healthy"
}

# Check Redis connectivity
check_redis() {
    print_status "Checking Redis connectivity..."
    
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is responding"
    else
        print_error "Redis is not responding"
        return 1
    fi
}

# Check TURN server
check_turn_server() {
    print_status "Checking TURN server..."
    
    if nc -z localhost 3478; then
        print_success "TURN server is accessible on port 3478"
    else
        print_error "TURN server is not accessible on port 3478"
        return 1
    fi
}

# Check SSL certificates
check_ssl() {
    print_status "Checking SSL certificates..."
    
    if curl -f -k -s "https://localhost:8443/health" > /dev/null 2>&1; then
        print_success "SSL certificates are working"
    else
        print_warning "SSL certificates may have issues"
        return 1
    fi
}

# Check WebRTC connectivity
check_webrtc() {
    print_status "Checking WebRTC connectivity..."
    
    # Test STUN server
    if timeout 5 bash -c 'echo "test" | nc -u stun.l.google.com 19302' > /dev/null 2>&1; then
        print_success "STUN server is accessible"
    else
        print_warning "STUN server may not be accessible"
    fi
    
    # Test TURN server (if configured)
    if docker-compose -f "$COMPOSE_FILE" exec -T turn-server turnadmin --show > /dev/null 2>&1; then
        print_success "TURN server is configured and accessible"
    else
        print_warning "TURN server may have configuration issues"
    fi
}

# Check resource usage
check_resources() {
    print_status "Checking resource usage..."
    
    local services=("voip-app" "redis" "turn-server")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q "$service"; then
            print_status "Checking resources for $service..."
            
            local cpu_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | grep "$service" | awk '{print $2}')
            local memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep "$service" | awk '{print $2}')
            
            echo "  $service - CPU: $cpu_usage, Memory: $memory_usage"
            
            # Check for high resource usage
            if [[ "$cpu_usage" > "80%" ]]; then
                print_warning "$service has high CPU usage: $cpu_usage"
            fi
            
            if [[ "$memory_usage" == *"GiB"* ]]; then
                local memory_gb=$(echo "$memory_usage" | sed 's/GiB//')
                if (( $(echo "$memory_gb > 2.0" | bc -l) )); then
                    print_warning "$service has high memory usage: $memory_usage"
                fi
            fi
        fi
    done
}

# Check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    echo "  Disk usage: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 80 ]; then
        print_warning "Disk usage is high: ${disk_usage}%"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        print_error "Disk usage is critical: ${disk_usage}%"
        return 1
    fi
    
    print_success "Disk space is adequate"
}

# Check network connectivity
check_network() {
    print_status "Checking network connectivity..."
    
    # Check internet connectivity
    if curl -f -s --connect-timeout 5 https://www.google.com > /dev/null 2>&1; then
        print_success "Internet connectivity is working"
    else
        print_warning "Internet connectivity may have issues"
    fi
    
    # Check DNS resolution
    if nslookup relay.nostr.band > /dev/null 2>&1; then
        print_success "DNS resolution is working"
    else
        print_warning "DNS resolution may have issues"
    fi
}

# Generate health report
generate_report() {
    print_status "Generating health report..."
    
    local report_file="health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Nostr VOIP Health Report"
        echo "========================="
        echo "Generated: $(date)"
        echo ""
        
        echo "Service Status:"
        docker-compose -f "$COMPOSE_FILE" ps
        echo ""
        
        echo "Application Health:"
        if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
            echo "  Status: Healthy"
        else
            echo "  Status: Unhealthy"
        fi
        echo ""
        
        echo "Resource Usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        echo ""
        
        echo "Disk Space:"
        df -h /
        echo ""
        
        echo "Network Status:"
        echo "  External connectivity: $(curl -f -s --connect-timeout 5 https://www.google.com > /dev/null 2>&1 && echo 'OK' || echo 'Failed')"
        echo "  DNS resolution: $(nslookup relay.nostr.band > /dev/null 2>&1 && echo 'OK' || echo 'Failed')"
        echo ""
        
        echo "SSL Certificate Status:"
        if curl -f -k -s "https://localhost:8443/health" > /dev/null 2>&1; then
            echo "  Status: Working"
        else
            echo "  Status: Issues detected"
        fi
        echo ""
        
        echo "WebRTC Connectivity:"
        echo "  STUN server: $(timeout 5 bash -c 'echo "test" | nc -u stun.l.google.com 19302' > /dev/null 2>&1 && echo 'Accessible' || echo 'Not accessible')"
        echo "  TURN server: $(nc -z localhost 3478 && echo 'Accessible' || echo 'Not accessible')"
        echo ""
        
    } > "$report_file"
    
    print_success "Health report generated: $report_file"
}

# Main health check function
main() {
    echo "🏥 Nostr VOIP Health Check"
    echo "============================"
    echo ""
    
    local failed_checks=0
    
    check_services_running || ((failed_checks++))
    check_application_health || ((failed_checks++))
    check_docker_health || ((failed_checks++))
    check_redis || ((failed_checks++))
    check_turn_server || ((failed_checks++))
    check_ssl || ((failed_checks++))
    check_webrtc || ((failed_checks++))
    check_resources || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_network || ((failed_checks++))
    
    generate_report
    
    echo ""
    if [ $failed_checks -eq 0 ]; then
        print_success "All health checks passed!"
        exit 0
    else
        print_error "$failed_checks health check(s) failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "quick")
        check_services_running
        check_application_health
        check_docker_health
        ;;
    "app")
        check_application_health
        ;;
    "redis")
        check_redis
        ;;
    "turn")
        check_turn_server
        ;;
    "ssl")
        check_ssl
        ;;
    "resources")
        check_resources
        ;;
    "disk")
        check_disk_space
        ;;
    "network")
        check_network
        ;;
    "report")
        generate_report
        ;;
    *)
        main "$@"
        ;;
esac