# Production Deployment Checklist — Linux Server + PM2

Use this pre-flight, launch, and post-launch checklist to ensure 100% reliable deployment on your Linux production server.

---

## 1. Pre-Flight Server Prerequisites

- [ ] Linux OS verified (Ubuntu 20.04/22.04/24.04 LTS or Debian 11/12)
- [ ] Node.js 20.x or 22.x LTS installed (`node -v`)
- [ ] `pnpm` installed globally (`pnpm -v`)
- [ ] `pm2` installed globally (`pm2 -v`)
- [ ] PostgreSQL 14+ service active (`sudo systemctl status postgresql`)
- [ ] PostgreSQL database (`sankara_eyebank`) and dedicated user (`sankara_user`) created
- [ ] Nginx installed (`nginx -v`) and firewall allows Ports 80 & 443 (`sudo ufw allow 'Nginx Full'`)

---

## 2. Code & Directory Preparation

- [ ] GitHub repository ZIP extracted into `/var/www/sankara-eyebank`
- [ ] Non-root Linux user ownership set (`sudo chown -R $USER:$USER /var/www/sankara-eyebank`)
- [ ] Runtime directories created with 755 permissions (`logs/`, `data/`, `uploads/`)
- [ ] `.env` file copied from `.env.example` (`cp .env.example .env`)
- [ ] `.env` contains valid production `DATABASE_URL`
- [ ] `.env` contains a strong 64-character `JWT_SECRET` and `SESSION_SECRET`
- [ ] `.env` contains correct public `APP_BASE_URL` (e.g. `https://eyebank.yourdomain.com`)
- [ ] `.env` contains correct `CORS_ORIGIN`

---

## 3. Database Schema & Build

- [ ] Dependencies installed cleanly via `pnpm install --frozen-lockfile`
- [ ] Database schema synchronized via `pnpm run db:push`
- [ ] Initial hospital units and admin credentials seeded via `pnpm run db:seed`
- [ ] Production build succeeds with 0 errors (`pnpm run build`)
- [ ] Static frontend bundle exists in `artifacts/sankara-eye/dist/public`
- [ ] Backend bundled entry point exists in `artifacts/api-server/dist/index.mjs`

---

## 4. PM2 Process Launch & Auto-Restart

- [ ] PM2 ecosystem configured in `ecosystem.config.cjs`
- [ ] Application started with `pm2 start ecosystem.config.cjs --env production`
- [ ] PM2 status is **online** (`pm2 status`)
- [ ] PM2 process list saved (`pm2 save`)
- [ ] PM2 systemd startup hook configured (`pm2 startup`)
- [ ] Health check endpoint responds with 200 OK (`curl http://127.0.0.1:8080/health`)
- [ ] Database latency is verified in health check (`"database":{"status":"connected"}`)

---

## 5. Nginx Reverse Proxy & SSL

- [ ] Nginx site configuration created in `/etc/nginx/sites-available/sankara-eyebank`
- [ ] Proxy pass configured to `http://127.0.0.1:8080`
- [ ] WebSocket upgrade headers enabled in Nginx
- [ ] Gzip compression and security headers enabled
- [ ] Nginx configuration syntax test passes (`sudo nginx -t`)
- [ ] Nginx service reloaded (`sudo systemctl reload nginx`)
- [ ] HTTPS certificate provisioned via Let's Encrypt (`sudo certbot --nginx -d yourdomain.com`)
- [ ] HTTP to HTTPS redirect working

---

## 6. Functional Verification

- [ ] Public website loads correctly at `https://yourdomain.com/`
- [ ] Public Eye Donation Pledge form loads at `https://yourdomain.com/donate`
- [ ] Eye Care Awareness page loads at `https://yourdomain.com/awareness`
- [ ] Coordinator Login works at `https://yourdomain.com/sign-in`
- [ ] Eye Calls Dashboard loads live calls at `https://yourdomain.com/dashboard`
- [ ] Emergency Dispatches and Done buttons work
- [ ] Activity Audit Log trail records actions at `https://yourdomain.com/audit-logs`
- [ ] SPA page refresh on nested routes (e.g. `/audit-logs`, `/pledges`) does not return 404
- [ ] Restarts survive without data corruption (`pm2 restart sankara-eyebank-api`)

---

## 7. Disaster Recovery & Backups

- [ ] Automated daily database backup cron job configured (`pg_dump`)
- [ ] Backup retention policy active (30 days)
- [ ] `deploy.sh` script tested for automated 1-click updates
