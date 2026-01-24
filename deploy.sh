#!/bin/bash

# Quick Deploy Script for GEMA Bulk Registration System
# Run this on the production server after pushing changes to GitHub

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/bulk-registration || exit 1

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Deploy Backend
echo "🔧 Deploying backend..."
cd server
npm install --production
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
cd ..

# Deploy Frontend
echo "🎨 Building frontend..."
cd client
npm install
npm run build
cd ..

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Visit: https://bulk.intlspellbee.com"

# Show PM2 status
pm2 list
