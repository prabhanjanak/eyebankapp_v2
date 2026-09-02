# Sankara Eye Bank & Donation System — Production Update Guide

This document is for the **System Administrator / DevOps Engineer** managing the production deployment of the Sankara Eye Bank System.

---

## 📌 Repository Information

- **GitHub Repository**: [https://github.com/prabhanjanak/eyebankapp_v2](https://github.com/prabhanjanak/eyebankapp_v2)
- **Branch**: `main`

---

## 🚀 Key Updates in This Release

1. **Executive Dean / Management Portal (`/management`)**:
   - High-level analytics dashboard for eye donation calls, successful corneal retrievals, conversion rates, and donor demographics.
   - Unit-wise leaderboard matrix for all 16 Sankara Eye Hospital branches.
   - One-click Excel/CSV report exporter.
2. **Automatic Database Seeding on Server Boot**:
   - Super admin accounts and all 16 hospital units automatically sync into PostgreSQL on server boot.
3. **Multi-Environment Support**:
   - Production ready for **Docker Compose**, **Linux PM2 (`deploy.sh`)**, and **Vercel Serverless**.

---

## 🔐 Default Production Credentials

These accounts are automatically seeded into PostgreSQL on application startup:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Dean / Executive** | `dean@sankaraeye.com` | `Dean@2026` | Management Analytics, Leaderboards & Reports |
| **Super Admin** | `admin@sankaraeye.com` | `Welcome@123` | Full System Administration & Settings |
| **Coordinator** | `saravanan@sankaraeye.com` | `Saravanan@2026` | Regional Coordinator & Call Dispatch |
| **Coordinator** | `prabhanjan@sankaraeye.com` | `Prabhanjan@2026` | Regional Coordinator & Call Dispatch |
| **Coordinator** | `sivaprakash@sankaraeye.com` | `Sivaprakash@2026` | Regional Coordinator & Call Dispatch |

---

## 🛠️ Method 1: Update Server via Docker Compose (Recommended)

If the production server is running via Docker:

```bash
# 1. Go to project folder
cd /var/www/sankara-eyebank

# 2. Pull the latest release from GitHub
git pull origin main

# 3. Rebuild and launch the production container
docker compose up -d --build
```

### Check Container Status:
```bash
docker compose ps
docker compose logs -f app
```
*(Press `Ctrl + C` to exit log stream)*

---

## ⚙️ Method 2: Update Server via PM2 (`deploy.sh`)

If the production server is running via PM2 / Node.js native:

```bash
# 1. Go to project folder
cd /var/www/sankara-eyebank

# 2. Pull the latest release from GitHub
git pull origin main

# 3. Run the automated deployment script
./deploy.sh
```

### Check PM2 Status:
```bash
pm2 status
pm2 logs api-server --lines 30
```

---

## ✅ Post-Deployment Health Check

Run this command on the server to verify application & database health:

```bash
curl http://localhost:8080/health
```

**Expected JSON Response:**
```json
{
  "status": "ok",
  "uptime": 12.45,
  "timestamp": "2026-09-02T11:00:00.000Z",
  "database": {
    "status": "connected",
    "latencyMs": 1
  }
}
```

---

## 🆘 Emergency Troubleshooting

- **Server Port**: Default is `8080` (Configurable via `PORT` in `.env`).
- **Database Backup**:
  ```bash
  docker compose exec db pg_dump -U sankara_user sankara_eyebank | gzip > /var/backups/sankara_db_$(date +%Y%m%d_%H%M%S).sql.gz
  ```
- **Restart Application**:
  - Docker: `docker compose restart app`
  - PM2: `pm2 restart api-server`
