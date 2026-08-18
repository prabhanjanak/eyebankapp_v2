#!/bin/sh
set -e

echo "=========================================================="
echo " Starting Sankara Eye Bank & Donation Production Container"
echo "=========================================================="

# Ensure runtime directories exist with proper permissions
mkdir -p /app/data /app/logs /app/uploads

# 1. Synchronize Database Schema (Drizzle ORM)
echo "--> Synchronizing PostgreSQL schema..."
if [ -n "$DATABASE_URL" ]; then
  pnpm run db:push || {
    echo "Warning: Database push failed on initial attempt. Retrying in 3 seconds..."
    sleep 3
    pnpm run db:push || echo "Warning: Continuing startup. Verify database connectivity."
  }
else
  echo "Warning: DATABASE_URL not set. Skipping schema synchronization."
fi

# 2. Seed Initial Admin & Hospital Units (Non-destructive)
echo "--> Verifying coordinator accounts and hospital units..."
if [ -n "$DATABASE_URL" ]; then
  pnpm run db:seed || echo "Note: Seeding step completed or skipped."
fi

# 3. Start Node.js Application
echo "--> Launching Application on port ${PORT:-8080}..."
exec node artifacts/api-server/dist/index.mjs
