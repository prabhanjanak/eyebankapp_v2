# Sankara Eye Bank & Donation System — Docker Deployment Guide

This guide is designed for **Linux Server Administrators** deploying the application using **Docker and Docker Compose**.

---

## 1. Quickstart (3 Commands)

```bash
# 1. Clone repository (or extract ZIP)
git clone https://github.com/prabhanjanak/eyebankapp_v2.git /var/www/sankara-eyebank
cd /var/www/sankara-eyebank

# 2. Configure environment
cp .env.example .env
nano .env # Set your JWT_SECRET and APP_BASE_URL

# 3. Build & Launch in Background
docker compose up -d --build
```

That's it! The application will:
1. Start PostgreSQL 16 in a healthy container.
2. Build the production Node.js & Vite SPA application.
3. Automatically synchronize database tables (`pnpm run db:push`).
4. Seed initial hospital units and coordinators (`pnpm run db:seed`).
5. Expose the full web portal and API on **`http://localhost:8080`**.

---

## 2. Docker Architecture

```text
Host System (Nginx / HTTPS:443)
       │
       ▼ (Port 8080)
┌─────────────────────────────────────────────────────────────┐
│ Docker Compose Network                                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Container: sankara_eyebank_app (Node.js 20 Alpine)   │   │
│   │ • API Server & Endpoints (/api)                     │   │
│   │ • Built SPA Frontend (/)                            │   │
│   │ • Health Check (/health)                            │   │
│   │ • Volumes: /app/data, /app/logs, /app/uploads       │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Container: sankara_eyebank_db (PostgreSQL 16)       │   │
│   │ • Persistent Volume: postgres_data                  │   │
│   │ • Internal Port: 5432                               │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Environment Variables (`.env`)

Configure these in your `.env` file before running `docker compose up -d`:

```ini
# Core Configuration
PORT=8080
APP_BASE_URL=https://eyebank.your-domain.com
CORS_ORIGIN=https://eyebank.your-domain.com

# PostgreSQL Credentials (Managed inside Docker)
DB_USER=sankara_user
DB_PASSWORD=YourStrongDatabasePassword123!#
DB_NAME=sankara_eyebank

# Security Secrets (Generate using: openssl rand -hex 32)
JWT_SECRET=8f9a2b7c4d5e6f1a0b3c5d7e9f2a4b6c8d0e1f3a5b7c9d1e3f5a7b9c1d3e5f7a
SESSION_SECRET=1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a8f9a2b7c4d5e6f1a0b3c5d7e9f

# Optional Email SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alerts@your-domain.com
SMTP_PASS=your_email_app_password
SMTP_FROM=Sankara Eye Bank Alerts <alerts@your-domain.com>
```

---

## 4. Daily Operations & Management Commands

### View Logs
```bash
# View live logs for the application
docker compose logs -f app

# View database logs
docker compose logs -f db
```

### Check Container Status & Health
```bash
docker compose ps
```

Expected output:
```text
NAME                 IMAGE                     STATUS                    PORTS
sankara_eyebank_app  sankara_eyebank_app:latest Up (healthy)              0.0.0.0:8080->8080/tcp
sankara_eyebank_db   postgres:16-alpine        Up (healthy)              127.0.0.1:5432->5432/tcp
```

### Verify Health Endpoint
```bash
curl -i http://localhost:8080/health
```

### Restart Services
```bash
docker compose restart app
```

### Updating to New Code Releases
```bash
git pull
docker compose up -d --build
```

---

## 5. Database Backups & Restore

### Create Instant Backup
```bash
docker compose exec db pg_dump -U sankara_user sankara_eyebank | gzip > /var/backups/sankara_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup
```bash
gunzip -c /var/backups/sankara_db_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T db psql -U sankara_user sankara_eyebank
```

---

## 6. Host Nginx Reverse Proxy & SSL Setup

Point Nginx on your host machine to Docker's port `8080`:

`/etc/nginx/sites-available/sankara-eyebank`:
```nginx
server {
    listen 80;
    server_name eyebank.your-domain.com;
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and secure with Let's Encrypt:
```bash
sudo ln -sf /etc/nginx/sites-available/sankara-eyebank /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d eyebank.your-domain.com
```
