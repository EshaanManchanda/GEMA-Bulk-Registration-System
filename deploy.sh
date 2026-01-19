#!/bin/bash

#############################################
# Bulk Registration System
# Deployment Script for intlspellbee.com
#############################################

set -e  # Exit on error

echo "========================================="
echo "Bulk Registration Deployment Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/bulk-registration"
FRONTEND_URL="https://bulk.intlspellbee.com"
API_URL="https://api.intlspellbee.com"

# Functions
function print_success {
    echo -e "${GREEN}✓ $1${NC}"
}

function print_error {
    echo -e "${RED}✗ $1${NC}"
}

function print_info {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if script is run from project root
if [ ! -f "package.json" ] && [ ! -d "server" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Starting deployment process..."
echo ""

# Step 1: Pull latest code
print_info "Step 1: Pulling latest code from repository..."
git pull origin master
print_success "Code updated successfully"
echo ""

# Step 2: Backend deployment
print_info "Step 2: Deploying backend..."
cd server

print_info "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

# Create logs directory if not exists
mkdir -p logs

print_info "Reloading backend with PM2..."
pm2 reload ecosystem.config.js --env production
print_success "Backend reloaded on port 5050"

cd ..
echo ""

# Step 3: Frontend deployment
print_info "Step 3: Deploying frontend..."
cd client

print_info "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

print_info "Building frontend..."
npm run build
print_success "Frontend built successfully"

cd ..
echo ""

# Step 4: Restart Nginx
print_info "Step 4: Reloading Nginx..."
sudo systemctl reload nginx
print_success "Nginx reloaded"
echo ""

# Step 5: Check application health
print_info "Step 5: Checking application health..."
sleep 3

# Check PM2 processes
if pm2 list | grep -q "online"; then
    print_success "Backend is running"
else
    print_error "Backend is not running. Please check PM2 logs."
    exit 1
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running. Please check Nginx status."
    exit 1
fi

echo ""
echo "========================================="
print_success "Deployment completed successfully!"
echo "========================================="
echo ""
echo "Application Status:"
echo "-------------------"
pm2 list
echo ""
echo "View logs with:"
echo "  Backend: pm2 logs bulk-backend"
echo "  Nginx: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "Application URLs:"
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend API: ${API_URL}/api/v1"
echo ""
