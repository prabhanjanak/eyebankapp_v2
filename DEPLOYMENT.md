# Sankara Eye Bank & Donation System — Production Deployment Guide

> **Target Environment**: Linux (Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11 / 12)  
> **Process Manager**: PM2  
> **Runtime**: Node.js 20.x LTS or 22.x LTS (via pnpm)  
> **Database**: PostgreSQL 14+  
> **Reverse Proxy**: Nginx (with Let's Encrypt SSL)

---

## 1. System Architecture

```text
       Internet (HTTPS / Port 443)
                  │
                  ▼
          Nginx Reverse Proxy
   ┌──────────────┴──────────────┐
   │ (SSL Termination, Gzip,     │
   │  Security Headers, Caching) │
   └──────────────┬──────────────┘
                  │ (HTTP / Port 8080)
                  ▼
         PM2 Process Manager
                  │
         Node.js 20+ Runtime
     (artifacts/api-server)
   ┌──────────────┴──────────────┐
   │ • REST API Endpoints (/api) │
   │ • Built SPA Frontend (/)    │
   │ • Audit Logger & Timers     │
   └──────────────┬──────────────┘
                  │ (TCP / Port 5432)
                  ▼
        PostgreSQL 14+ Database
```

---

## 2. Server Requirements

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 | Ubuntu 24.04 LTS |
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 1 GB | 2 GB+ |
| **Disk Storage** | 10 GB SSD | 20 GB+ SSD |
| **Node.js** | 20.12+ LTS | 20.x or 22.x LTS |
| **Package Manager** | pnpm 9.0+ | pnpm 10.x |
| **Database** | PostgreSQL 14 | PostgreSQL 15 or 16 |

---

## 3. Step-by-Step Installation

### Step 1: Install System Packages & Node.js 20 LTS

Run as `root` or `sudo` user:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install essential tools
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# 3. Install Node.js 20 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Verify Node.js version
node -v # Should be v20.x.x
npm -v

# 5. Install pnpm and PM2 globally
sudo npm install -g pnpm pm2
```

---

### Step 2: Configure PostgreSQL Database

```bash
# 1. Switch to the postgres system user
sudo -u postgres psql

# 2. Inside PostgreSQL prompt, run the following SQL commands:
CREATE USER sankara_user WITH ENCRYPTED PASSWORD 'sankara_secure_pass_2026';
CREATE DATABASE sankara_eyebank OWNER sankara_user;
GRANT ALL PRIVILEGES ON DATABASE sankara_eyebank TO sankara_user;
\q
```

---

### Step 3: Deploy Application Code

Place the project in `/var/www/sankara-eyebank`:

```bash
# 1. Create directory and assign ownership to your non-root user (e.g., ubuntu)
sudo mkdir -p /var/www/sankara-eyebank
sudo chown -R $USER:$USER /var/www/sankara-eyebank

# 2. Extract GitHub ZIP into /var/www/sankara-eyebank
cd /var/www/sankara-eyebank
# (Extract your ZIP file or clone repository here)

# 3. Create required runtime directories with safe permissions
mkdir -p logs data uploads
chmod 755 logs data uploads
```

---

### Step 4: Configure Environment Variables (`.env`)

Create your `.env` file from `.env.example`:

```bash
cp .env.example .env
nano .env
```

Set the following production parameters in `.env`:

```ini
# Core Environment
NODE_ENV=production
PORT=8080

# Public URL of your domain (Used for certificates & notifications)
APP_BASE_URL=https://eyebank.your-domain.com

# CORS Configuration
CORS_ORIGIN=https://eyebank.your-domain.com

# Database Connection (Match credentials created in Step 2)
DATABASE_URL=postgresql://sankara_user:sankara_secure_pass_2026@127.0.0.1:5432/sankara_eyebank
DATABASE_SSL=false
DATABASE_POOL_MAX=20

# Security Secrets (Generate using: openssl rand -hex 32)
JWT_SECRET=8f9a2b7c4d5e6f1a0b3c5d7e9f2a4b6c8d0e1f3a5b7c9d1e3f5a7b9c1d3e5f7a
SESSION_SECRET=1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a8f9a2b7c4d5e6f1a0b3c5d7e9f

# Optional Email SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alerts@your-domain.com
SMTP_PASS=your_app_password
SMTP_FROM=Sankara Eye Bank Alerts <alerts@your-domain.com>

# Logging
LOG_LEVEL=info
SETTINGS_FILE_PATH=./data/settings.json
```

---

### Step 5: Install Dependencies, Migrate Database & Build

```bash
# 1. Install all dependencies
pnpm install --frozen-lockfile

# 2. Synchronize database schema (Drizzle ORM)
pnpm run db:push

# 3. Seed initial Hospital Units & Coordinators (Optional / Safe)
pnpm run db:seed

# 4. Build both frontend SPA and backend API
pnpm run build
```

---

### Step 6: Start Application with PM2

```bash
# 1. Start application under PM2 using the production ecosystem config
pm2 start ecosystem.config.cjs --env production

# 2. Save PM2 process list so it automatically restarts on server reboot
pm2 save

# 3. Generate systemd startup script (Copy and run the command that PM2 outputs)
pm2 startup
```

Verify the application is running:

```bash
pm2 status
curl http://127.0.0.1:8080/health
```

Expected output:

```json
{
  "status": "ok",
  "uptime": 12.5,
  "database": {
    "status": "connected",
    "latencyMs": 1
  }
}
```

---

### Step 7: Configure Nginx Reverse Proxy

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/sankara-eyebank
```

Paste the following configuration (replace `eyebank.your-domain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name eyebank.your-domain.com;

    # Maximum file upload size
    client_max_body_size 25M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Reverse Proxy to PM2 Node.js Application
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and test Nginx:

```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/sankara-eyebank /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### Step 8: Enable HTTPS SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d eyebank.your-domain.com
```

Select the option to automatically redirect HTTP traffic to HTTPS.

---

## 4. Automated 1-Click Update Script (`./deploy.sh`)

Whenever you deploy new code or updates:

```bash
cd /var/www/sankara-eyebank
./deploy.sh
```

`deploy.sh` automatically:
1. Verifies system prerequisites.
2. Installs updated dependencies.
3. Synchronizes database tables.
4. Rebuilds the frontend & backend.
5. Performs a zero-downtime PM2 reload (`pm2 reload`).
6. Executes a health check verification.

---

## 5. Daily Operations & Troubleshooting

### PM2 Process Management

```bash
# View running process status
pm2 status

# View live consolidated logs
pm2 logs sankara-eyebank-api

# View last 100 error lines
pm2 logs sankara-eyebank-api --err --lines 100

# Monitor CPU and Memory usage in real time
pm2 monit

# Restart application
pm2 restart sankara-eyebank-api

# Stop application
pm2 stop sankara-eyebank-api
```

### Health Check Endpoint

```bash
curl -i https://eyebank.your-domain.com/health
```

---

## 6. Database Backups (Automated Cron Job)

Create an automated daily PostgreSQL backup script:

```bash
sudo mkdir -p /var/backups/sankara-db
sudo nano /usr/local/bin/backup-sankara-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sankara-db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/sankara_eyebank_$TIMESTAMP.sql.gz"

pg_dump -U sankara_user -h 127.0.0.1 sankara_eyebank | gzip > "$FILENAME"

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
```

Make it executable and add to crontab:

```bash
sudo chmod +x /usr/local/bin/backup-sankara-db.sh
sudo crontab -e
# Add line: Run daily at 02:00 AM
0 2 * * * /usr/local/bin/backup-sankara-db.sh
```
