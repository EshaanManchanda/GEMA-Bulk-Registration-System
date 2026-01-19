# Deployment Guide

Bulk Registration System deployment to test subdomains.

## URLs

| Service  | URL                              | Port |
|----------|----------------------------------|------|
| Frontend | https://bulk.intlspellbee.com    | 5173 |
| API      | https://api.intlspellbee.com     | 5050 |

---

## Prerequisites

- Ubuntu 20.04+ VPS
- Node.js 18+
- MongoDB 6+
- Nginx
- PM2 (`npm install -g pm2`)
- Certbot (for SSL)

---

## 1. Server Setup

### Install dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Install MongoDB

```bash
# Import MongoDB GPG key
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install
sudo apt update && sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 2. DNS Configuration

Add these DNS records (A records pointing to your VPS IP):

| Type | Name | Value        |
|------|------|--------------|
| A    | bulk | YOUR_VPS_IP  |
| A    | api  | YOUR_VPS_IP  |

---

## 3. Clone & Configure

```bash
# Create directory
sudo mkdir -p /var/www/bulk-registration
sudo chown $USER:$USER /var/www/bulk-registration

# Clone repository
cd /var/www/bulk-registration
git clone <your-repo-url> .

# Or copy files manually
```

### Configure Environment Files

**Client** (`client/.env`):
```env
VITE_API_URL=https://api.intlspellbee.com/api/v1
VITE_APP_URL=https://bulk.intlspellbee.com
```

**Server** (`server/.env`):
```env
NODE_ENV=production
PORT=5050
API_URL=https://api.intlspellbee.com
BASE_URL=https://api.intlspellbee.com
FRONTEND_URL=https://bulk.intlspellbee.com
MONGODB_URI=mongodb://localhost:27017/bulk-registration
ALLOWED_ORIGINS=https://bulk.intlspellbee.com
# ... other env variables
```

---

## 4. SSL Certificates

```bash
# Generate SSL for both subdomains
sudo certbot certonly --nginx -d bulk.intlspellbee.com -d api.intlspellbee.com

# Or use wildcard (requires DNS verification)
sudo certbot certonly --manual --preferred-challenges dns -d *.intlspellbee.com -d intlspellbee.com
```

---

## 5. Nginx Configuration

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/intlspellbee

# Create symlink
sudo ln -s /etc/nginx/sites-available/intlspellbee /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## 6. Build & Deploy

### Backend

```bash
cd /var/www/bulk-registration/server

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Frontend

```bash
cd /var/www/bulk-registration/client

# Install dependencies
npm install

# Build
npm run build
```

---

## 7. Verify Deployment

```bash
# Check PM2 status
pm2 list

# Check backend logs
pm2 logs bulk-backend

# Check nginx status
sudo systemctl status nginx

# Test API
curl https://api.intlspellbee.com/health

# Test frontend
curl -I https://bulk.intlspellbee.com
```

---

## Quick Deploy (After Initial Setup)

Run from project root:

```bash
./deploy.sh
```

Or manually:

```bash
git pull origin master

# Backend
cd server && npm install --production && pm2 reload ecosystem.config.js --env production && cd ..

# Frontend
cd client && npm install && npm run build && cd ..

# Reload nginx
sudo systemctl reload nginx
```

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
pm2 logs bulk-backend --lines 100

# Check if port 5050 is in use
sudo lsof -i :5050

# Restart
pm2 restart bulk-backend
```

### Nginx errors

```bash
# Test config
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log

# Check access log
sudo tail -f /var/log/nginx/api-intlspellbee-access.log
```

### CORS errors

Check `server/.env`:
```env
ALLOWED_ORIGINS=https://bulk.intlspellbee.com
```

### SSL certificate issues

```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### MongoDB connection issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 list` | Show all processes |
| `pm2 logs` | View all logs |
| `pm2 restart all` | Restart all processes |
| `pm2 stop all` | Stop all processes |
| `pm2 monit` | Monitor processes |
| `sudo systemctl reload nginx` | Reload nginx |
| `sudo nginx -t` | Test nginx config |

---

## File Structure on Server

```
/var/www/bulk-registration/
├── client/
│   ├── dist/          # Built frontend (served by nginx)
│   └── ...
├── server/
│   ├── ecosystem.config.js
│   ├── logs/
│   └── ...
├── nginx.conf
└── deploy.sh
```
