#!/bin/bash

# Backup Script for Nostr VOIP
# This script creates comprehensive backups of the entire application

set -e

# Configuration
PROJECT_NAME="nostr-voip"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Create backup directory
create_backup_dir() {
    print_status "Creating backup directory..."
    
    mkdir -p "$BACKUP_DIR"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Failed to create backup directory"
        exit 1
    fi
    
    mkdir -p "$BACKUP_PATH"
    print_success "Backup directory created: $BACKUP_PATH"
}

# Stop services gracefully
stop_services() {
    print_status "Stopping services gracefully..."
    
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

# Backup Docker volumes
backup_volumes() {
    print_status "Backing up Docker volumes..."
    
    # List of volumes to backup
    local volumes=(
        "nostr_voip_ssl_certs"
        "nostr_voip_redis_data"
        "nostr_voip_turn_logs"
        "nostr_voip_nginx_logs"
    )
    
    for volume in "${volumes[@]}"; do
        if docker volume ls | grep -q "$volume"; then
            print_status "Backing up volume: $volume"
            
            # Create temporary container to backup volume
            docker run --rm \
                -v "${volume}:/volume_data" \
                -v "${BACKUP_PATH}/volumes:/backup" \
                alpine:latest \
                tar czf "/backup/${volume}.tar.gz" -C /volume_data .
            
            if [ $? -eq 0 ]; then
                print_success "Volume $volume backed up successfully"
            else
                print_error "Failed to backup volume $volume"
            fi
        else
            print_warning "Volume $volume not found, skipping"
        fi
    done
}

# Backup configuration files
backup_configs() {
    print_status "Backing up configuration files..."
    
    # Configuration files to backup
    local configs=(
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "docker-compose.dev.yml"
        "nginx.conf"
        "turnserver.conf"
        ".env"
        "Dockerfile"
        "Dockerfile.dev"
    )
    
    mkdir -p "$BACKUP_PATH/configs"
    
    for config in "${configs[@]}"; do
        if [ -f "$config" ]; then
            cp "$config" "$BACKUP_PATH/configs/"
            print_success "Configuration $config backed up"
        else
            print_warning "Configuration $config not found, skipping"
        fi
    done
    
    # Backup scripts directory
    if [ -d "scripts" ]; then
        cp -r scripts "$BACKUP_PATH/"
        print_success "Scripts directory backed up"
    fi
}

# Backup SSL certificates
backup_ssl() {
    print_status "Backing up SSL certificates..."
    
    if [ -d "ssl" ]; then
        cp -r ssl "$BACKUP_PATH/"
        print_success "SSL certificates backed up"
    else
        print_warning "SSL directory not found, skipping"
    fi
}

# Create backup manifest
create_manifest() {
    print_status "Creating backup manifest..."
    
    cat > "$BACKUP_PATH/manifest.txt" << EOF
Nostr VOIP Backup Manifest
=========================
Backup Name: $BACKUP_NAME
Backup Date: $(date)
Backup Timestamp: $TIMESTAMP
Project: $PROJECT_NAME
Backup Type: Full

Contents:
========
EOF
    
    # List all backed up files and directories
    (cd "$BACKUP_PATH" && find . -type f -exec echo "  {}" \;) >> "$BACKUP_PATH/manifest.txt"
    
    # Add system information
    cat >> "$BACKUP_PATH/manifest.txt" << EOF

System Information:
================
Docker Version: $(docker --version)
Docker Compose Version: $(docker-compose --version)
OS: $(uname -a)
Architecture: $(uname -m)

Backup Notes:
============
- This backup contains all application data, configurations, and SSL certificates
- To restore, use the restore.sh script
- Verify backup integrity before restoring
- Keep backups in a secure location
EOF
    
    print_success "Backup manifest created"
}

# Compress backup
compress_backup() {
    print_status "Compressing backup..."
    
    (cd "$BACKUP_DIR" && tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME")
    
    if [ $? -eq 0 ]; then
        print_success "Backup compressed successfully"
        rm -rf "$BACKUP_PATH"
    else
        print_error "Failed to compress backup"
        exit 1
    fi
}

# Calculate backup size and checksum
verify_backup() {
    print_status "Verifying backup integrity..."
    
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    
    if [ -f "$backup_file" ]; then
        # Calculate file size
        local size=$(du -h "$backup_file" | cut -f1)
        
        # Calculate checksum
        local checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)
        
        # Create verification file
        cat > "${backup_file}.verify" << EOF
Backup Verification File
====================
Backup File: ${BACKUP_NAME}.tar.gz
File Size: $size
SHA256 Checksum: $checksum
Verification Date: $(date)
EOF
        
        print_success "Backup verification completed"
        echo "File Size: $size"
        echo "SHA256: $checksum"
    else
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups..."
    
    # Keep last 7 days of backups
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -exec rm {} \;
    
    if [ $? -eq 0 ]; then
        print_success "Old backups cleaned up"
    else
        print_warning "Cleanup may not have completed successfully"
    fi
}

# Restart services
restart_services() {
    print_status "Restarting services..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_success "Services restarted successfully"
    else
        print_error "Failed to restart services"
        exit 1
    fi
}

# Show backup summary
show_summary() {
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    
    echo ""
    print_success "Backup completed successfully!"
    echo ""
    echo "📦 Backup Summary:"
    echo "=================="
    echo "Backup Name: $BACKUP_NAME"
    echo "Backup File: $backup_file"
    echo "Backup Size: $(du -h "$backup_file" | cut -f1)"
    echo "Backup Date: $(date)"
    echo ""
    echo "📋 Verification:"
    echo "SHA256 Checksum: $(sha256sum "$backup_file" | cut -d' ' -f1)"
    echo "Verification File: ${backup_file}.verify"
    echo ""
    echo "🔄 Restore Instructions:"
    echo "======================="
    echo "1. Copy backup file to target system"
    echo "2. Run: ./scripts/restore.sh <backup-file>"
    echo "3. Follow restore prompts"
    echo ""
    echo "🗂  Cleanup Policy:"
    echo "=================="
    echo "Old backups (>7 days) are automatically cleaned up"
    echo "Manual cleanup: rm -rf $BACKUP_DIR"
    echo ""
    echo "📊 Current Backups:"
    echo "=================="
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -10 || echo "No previous backups found"
}

# Main backup function
main() {
    echo "💾 Nostr VOIP Backup Script"
    echo "============================="
    echo ""
    
    create_backup_dir
    stop_services
    backup_volumes
    backup_configs
    backup_ssl
    create_manifest
    compress_backup
    verify_backup
    cleanup_old_backups
    restart_services
    show_summary
    
    echo ""
    print_success "Backup process completed!"
}

# Handle script arguments
case "${1:-}" in
    "quick")
        print_status "Quick backup (without service restart)..."
        create_backup_dir
        backup_volumes
        backup_configs
        backup_ssl
        create_manifest
        compress_backup
        verify_backup
        show_summary
        ;;
    "configs-only")
        print_status "Configuration backup only..."
        create_backup_dir
        backup_configs
        backup_ssl
        create_manifest
        compress_backup
        verify_backup
        show_summary
        ;;
    "volumes-only")
        print_status "Volumes backup only..."
        create_backup_dir
        stop_services
        backup_volumes
        restart_services
        create_manifest
        compress_backup
        verify_backup
        show_summary
        ;;
    *)
        main "$@"
        ;;
esac