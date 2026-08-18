#!/usr/bin/env bash
# ==============================================================================
# SANKARA EYE BANK - PRODUCTION DEPLOYMENT & UPDATE SCRIPT
# OS: Linux (Ubuntu 20.04 / 22.04 / 24.04, Debian 11 / 12)
# Usage: ./deploy.sh
# ==============================================================================

set -euo pipefail

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

APP_NAME="sankara-eyebank-api"
PORT="${PORT:-8080}"

echo -e "${CYAN}${BOLD}==============================================================${NC}"
echo -e "${CYAN}${BOLD}  Sankara Eye Bank System — Linux PM2 Production Deployment  ${NC}"
echo -e "${CYAN}${BOLD}==============================================================${NC}\n"

# 1. Verify Prerequisites
echo -e "${BOLD}[1/7] Checking environment prerequisites...${NC}"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}ERROR: Node.js is not installed. Please install Node.js 20 LTS or higher.${NC}"
    exit 1
fi
echo -e "  ✓ Node.js $(node --version)"

if ! command -v pnpm >/dev/null 2>&1; then
    echo -e "${YELLOW}pnpm not found. Installing pnpm globally via npm...${NC}"
    npm install -g pnpm
fi
echo -e "  ✓ pnpm $(pnpm --version)"

if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}PM2 not found. Installing PM2 globally via npm...${NC}"
    npm install -g pm2
fi
echo -e "  ✓ PM2 $(pm2 --version)"

# 2. Check .env Configuration
echo -e "\n${BOLD}[2/7] Checking environment configuration (.env)...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}No .env file found. Creating .env from .env.example...${NC}"
        cp .env.example .env
        echo -e "${RED}${BOLD}CRITICAL: A new .env was created. Please edit .env with your real DATABASE_URL and JWT_SECRET before running this script again.${NC}"
        exit 1
    else
        echo -e "${RED}ERROR: .env file is missing and no .env.example found.${NC}"
        exit 1
    fi
fi
echo -e "  ✓ .env configuration file exists"

# 3. Create required runtime directories
echo -e "\n${BOLD}[3/7] Setting up runtime storage & logs directories...${NC}"
mkdir -p logs data uploads
chmod 755 logs data uploads
echo -e "  ✓ Created runtime directories: ./logs, ./data, ./uploads"

# 4. Install Dependencies
echo -e "\n${BOLD}[4/7] Installing production dependencies...${NC}"
pnpm install --frozen-lockfile || pnpm install
echo -e "  ✓ Dependencies installed successfully"

# 5. Database Migration / Schema Sync
echo -e "\n${BOLD}[5/7] Synchronizing database schema...${NC}"
pnpm run db:push
echo -e "  ✓ Database schema is up to date"

# 6. Build Production Bundles
echo -e "\n${BOLD}[6/7] Building production frontend and backend assets...${NC}"
pnpm run build
echo -e "  ✓ Production build completed"

# 7. Start / Reload with PM2
echo -e "\n${BOLD}[7/7] Launching application with PM2...${NC}"
if pm2 list | grep -q "${APP_NAME}"; then
    echo -e "  Reloading existing PM2 process '${APP_NAME}'..."
    pm2 reload ecosystem.config.cjs --env production
else
    echo -e "  Starting new PM2 process '${APP_NAME}'..."
    pm2 start ecosystem.config.cjs --env production
fi

# Save PM2 process list for auto-resurrection on server reboot
pm2 save >/dev/null 2>&1 || true
echo -e "  ✓ PM2 state saved"

# 8. Health Check Verification
echo -e "\n${BOLD}Verifying health endpoint (http://127.0.0.1:${PORT}/health)...${NC}"
sleep 2

HEALTH_RESPONSE=$(curl -s "http://127.0.0.1:${PORT}/health" || echo "")
if echo "${HEALTH_RESPONSE}" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}${BOLD}✓ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}Application is running healthy at http://127.0.0.1:${PORT}${NC}"
    echo -e "Status: ${HEALTH_RESPONSE}"
else
    echo -e "${YELLOW}Warning: Health endpoint returned:${NC} ${HEALTH_RESPONSE}"
    echo -e "Check application logs with: ${BOLD}pm2 logs ${APP_NAME}${NC}"
fi

echo -e "\n${CYAN}Useful PM2 Commands:${NC}"
echo -e "  • View status: ${BOLD}pm2 status${NC}"
echo -e "  • View live logs: ${BOLD}pm2 logs ${APP_NAME}${NC}"
echo -e "  • Monitor memory/CPU: ${BOLD}pm2 monit${NC}"
echo -e "  • Restart application: ${BOLD}pm2 restart ${APP_NAME}${NC}"
echo -e "  • Stop application: ${BOLD}pm2 stop ${APP_NAME}${NC}\n"
