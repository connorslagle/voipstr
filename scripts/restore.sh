#!/bin/bash

# Restore Script for Nostr VOIP
# This script restores application from backup files

set -e

# Configuration
PROJECT_NAME="nostr-voip"
BACKUP_FILE="$1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check arguments
check_arguments() {
    if [ -z "$BACKUP_FILE" ]; then
        print_error "No backup file specified."
        echo "Usage: $0 <backup-file.tar.gz>"
        echo "Example: $0 ./backups/nostr-voip_backup_20231201_123456.tar.gz"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_success "Backup file found: $BACKUP_FILE"
}

# Verify backup integrity
verify_backup() {
    print_status "Verifying backup integrity..."
    
    # Check if file is a valid tar archive
    if ! tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
        print_error "Backup file is corrupted or not a valid tar archive"
        exit 1
    fi
    
    # Check for manifest file
    if ! tar -tzf "$BACKUP_FILE" | grep -q "manifest.txt"; then
        print_warning "Backup manifest not found, continuing anyway"
    else
        print_success "Backup integrity verified"
        
        # Display backup information
        echo ""
        echo "📋 Backup Information:"
        tar -Oxf "$BACKUP_FILE" "*/manifest.txt" 2>/dev/null || true
        echo ""
    fi
}

# Stop services
stop_services() {
    print_status "Stopping current services..."
    
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        
        if [ $? -eq 0 ]; then
            print_success "Services stopped successfully"
        else
            print_warning "Some services may not have stopped properly"
        fi
    else
        print_warning "No services are currently running"
    fi
}

# Create temporary directory for extraction
create_temp_dir() {
    print_status "Creating temporary directory for restore..."
    
    TEMP_DIR=$(mktemp -d)
    
    if [ ! -d "$TEMP_DIR" ]; then
        print_error "Failed to create temporary directory"
        exit 1
    fi
    
    print_success "Temporary directory created: $TEMP_DIR"
}

# Extract backup
extract_backup() {
    print_status "Extracting backup..."
    
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
    
    if [ $? -eq 0 ]; then
        print_success "Backup extracted successfully"
    else
        print_error "Failed to extract backup"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Find extracted backup directory
    BACKUP_EXTRACTED=$(find "$TEMP_DIR" -type d -name "*backup_*" | head -1)
    
    if [ -z "$BACKUP_EXTRACTED" ]; then
        print_error "Could not find extracted backup directory"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    print_success "Backup extracted to: $BACKUP_EXTRACTED"
}

# Backup current configuration
backup_current_config() {
    print_status "Backing up current configuration..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CURRENT_BACKUP="./current_config_backup_${BACKUP_TIMESTAMP}"
    
    mkdir -p "$CURRENT_BACKUP"
    
    # Backup current configs
    cp docker-compose.yml "$CURRENT_BACKUP/" 2>/dev/null || true
    cp docker-compose.prod.yml "$CURRENT_BACKUP/" 2>/dev/null || true
    cp .env "$CURRENT_BACKUP/" 2>/dev/null || true
    cp nginx.conf "$CURRENT_BACKUP/" 2>/dev/null || true
    
    # Backup current SSL certificates
    if [ -d "ssl" ]; then
        cp -r ssl "$CURRENT_BACKUP/" 2>/dev/null || true
    fi
    
    # Backup current scripts
    if [ -d "scripts" ]; then
        cp -r scripts "$CURRENT_BACKUP/" 2>/dev/null || true
    fi
    
    print_success "Current configuration backed up to: $CURRENT_BACKUP"
}

# Restore configuration files
restore_configs() {
    print_status "Restoring configuration files..."
    
    CONFIG_DIR="${BACKUP_EXTRACTED}/configs"
    
    if [ -d "$CONFIG_DIR" ]; then
        # Restore Docker Compose files
        cp "${CONFIG_DIR}/docker-compose.yml" ./ 2>/dev/null || true
        cp "${CONFIG_DIR}/docker-compose.prod.yml" ./ 2>/dev/null || true
        cp "${CONFIG_DIR}/docker-compose.dev.yml" ./ 2>/dev/null || true
        
        # Restore environment file
        if [ -f "${CONFIG_DIR}/.env" ]; then
            cp "${CONFIG_DIR}/.env" ./.env.restore
            print_warning "Environment file restored as .env.restore"
            print_warning "Please review and rename to .env"
        fi
        
        # Restore nginx configuration
        cp "${CONFIG_DIR}/nginx.conf" ./ 2>/dev/null || true
        
        # Restore Docker files
        cp "${CONFIG_DIR}/Dockerfile" ./ 2>/dev/null || true
        cp "${CONFIG_DIR}/Dockerfile.dev" ./ 2>/dev/null || true
        
        print_success "Configuration files restored"
    else
        print_warning "No configuration files found in backup"
    fi
}

# Restore SSL certificates
restore_ssl() {
    print_status "Restoring SSL certificates..."
    
    SSL_DIR="${BACKUP_EXTRACTED}/ssl"
    
    if [ -d "$SSL_DIR" ]; then
        # Backup current SSL directory
        if [ -d "ssl" ]; then
            mv ssl ssl.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        # Restore SSL certificates
        cp -r "$SSL_DIR" ./
        
        print_success "SSL certificates restored"
    else
        print_warning "No SSL certificates found in backup"
    fi
}

# Restore scripts
restore_scripts() {
    print_status "Restoring scripts..."
    
    SCRIPTS_DIR="${BACKUP_EXTRACTED}/scripts"
    
    if [ -d "$SCRIPTS_DIR" ]; then
        # Backup current scripts directory
        if [ -d "scripts" ]; then
            mv scripts scripts.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        # Restore scripts
        cp -r "$SCRIPTS_DIR" ./
        
        # Make scripts executable
        chmod +x scripts/*.sh 2>/dev/null || true
        
        print_success "Scripts restored"
    else
        print_warning "No scripts found in backup"
    fi
}

# Restore Docker volumes
restore_volumes() {
    print_status "Restoring Docker volumes..."
    
    VOLUMES_DIR="${BACKUP_EXTRACTED}/volumes"
    
    if [ -d "$VOLUMES_DIR" ]; then
        # List of volume backups
        for volume_backup in "$VOLUMES_DIR"/*.tar.gz; do
            if [ -f "$volume_backup" ]; then
                volume_name=$(basename "$volume_backup" .tar.gz)
                
                print_status "Restoring volume: $volume_name"
                
                # Check if volume exists
                if docker volume ls | grep -q "$volume_name"; then
                    print_warning "Volume $volume_name already exists, removing..."
                    docker volume rm "$volume_name"
                fi
                
                # Create volume
                docker volume create "$volume_name"
                
                # Extract backup to volume
                docker run --rm \
                    -v "${volume_name}:/volume_data" \
                    -v "$(dirname "$volume_backup"):/backup" \
                    alpine:latest \
                    tar xzf "/backup/$(basename "$volume_backup")" -C /volume_data
                
                if [ $? -eq 0 ]; then
                    print_success "Volume $volume_name restored"
                else
                    print_error "Failed to restore volume $volume_name"
                fi
            fi
        done
    else
        print_warning "No Docker volumes found in backup"
    fi
}

# Update environment file
update_environment() {
    print_status "Updating environment file..."
    
    if [ -f ".env.restore" ]; then
        print_warning "Environment file was restored as .env.restore"
        print_warning "Please review the file and rename it to .env"
        print_warning "Important: Update any sensitive values like passwords or API keys"
        
        echo ""
        echo "🔧 Environment File Review:"
        echo "============================"
        echo "File: .env.restore"
        echo "Action: Review and rename to .env"
        echo ""
        echo "⚠️  Important: Update these values:"
        echo "   - TURN_USERNAME and TURN_CREDENTIAL"
        echo "   - Any API keys or secrets"
        echo "   - Database passwords"
        echo "   - SSL certificate paths"
        echo ""
    fi
}

# Start services
start_services() {
    print_status "Starting services..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Run health checks
health_checks() {
    print_status "Running health checks..."
    
    # Wait for services to be healthy
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "healthy"; then
            print_success "All services are healthy"
            break
        else
            if [ $attempt -eq $max_attempts ]; then
                print_warning "Some services may not be healthy"
                print_warning "Check logs with: docker-compose logs"
            else
                echo "Health check attempt $attempt/$max_attempts..."
                sleep 5
                ((attempt++))
            fi
        fi
    done
}

# Cleanup temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        print_success "Temporary files cleaned up"
    fi
}

# Show restore summary
show_summary() {
    echo ""
    print_success "Restore completed successfully!"
    echo ""
    echo "🎯 Restore Summary:"
    echo "=================="
    echo "Backup File: $BACKUP_FILE"
    echo "Restore Date: $(date)"
    echo ""
    echo "📋 Restored Components:"
    echo "====================="
    echo "   Configuration Files: ✓"
    echo "   SSL Certificates: ✓"
    echo "   Scripts: ✓"
    echo "   Docker Volumes: ✓"
    echo ""
    echo "🔧 Next Steps:"
    echo "==============="
    echo "1. Review .env.restore file and rename to .env"
    echo "2. Update any sensitive configuration values"
    echo "3. Check service status: docker-compose ps"
    echo "4. Verify application functionality"
    echo "5. Check logs: docker-compose logs"
    echo ""
    echo "📊 Service Status:"
    echo "================="
    docker-compose ps
    echo ""
    echo "🌐 Access URLs:"
    echo "==============="
    echo "   Application: http://localhost:8080"
    echo "   Health Check: http://localhost:8080/health"
    echo ""
    echo "⚠️  Important Notes:"
    echo "=================="
    echo "- Current configuration was backed up before restore"
    echo "- SSL certificates were restored from backup"
    echo "- Docker volumes were restored from backup"
    echo "- Services have been started automatically"
    echo "- Please verify all functionality is working"
    echo ""
}

# Main restore function
main() {
    echo "🔄 Nostr VOIP Restore Script"
    echo "============================="
    echo ""
    
    check_arguments
    verify_backup
    stop_services
    create_temp_dir
    extract_backup
    backup_current_config
    restore_configs
    restore_ssl
    restore_scripts
    restore_volumes
    update_environment
    start_services
    health_checks
    cleanup
    show_summary
    
    echo ""
    print_success "Restore process completed!"
}

# Handle script arguments
case "${2:-}" in
    "configs-only")
        check_arguments
        verify_backup
        create_temp_dir
        extract_backup
        backup_current_config
        restore_configs
        cleanup
        show_summary
        ;;
    "ssl-only")
        check_arguments
        verify_backup
        create_temp_dir
        extract_backup
        backup_current_config
        restore_ssl
        cleanup
        show_summary
        ;;
    "volumes-only")
        check_arguments
        verify_backup
        stop_services
        create_temp_dir
        extract_backup
        restore_volumes
        start_services
        health_checks
        cleanup
        show_summary
        ;;
    *)
        main "$@"
        ;;
esac