# Sankara Eye Bank & Donation System — Vercel Deployment Guide

This guide describes how to deploy the entire full-stack application (React SPA + Express API + PostgreSQL) to **Vercel**.

---

## 1. Quickstart Deployment (Via Vercel Web Dashboard)

1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Select and import your GitHub repository: **`prabhanjanak/eyebankapp_v2`**.
3. Vercel will automatically detect `vercel.json` and configure the project.
4. Under **Environment Variables**, add your database connection and secrets (see Section 2 below).
5. Click **Deploy**.

---

## 2. Environment Variables Configuration

Add these key-value pairs in the Vercel Project Settings (**Settings → Environment Variables**):

| Variable Name | Value / Description |
| :--- | :--- |
| **`DATABASE_URL`** | Connection string to your cloud PostgreSQL database (Supabase, Neon, AWS RDS, DigitalOcean, or pooled Postgres) e.g., `postgresql://sankara_user:sankara_secure_pass_2026@your-db-host:5432/sankara_eyebank` |
| **`DATABASE_SSL`** | `true` (Required for cloud-managed PostgreSQL SSL) |
| **`JWT_SECRET`** | `8f9a2b7c4d5e6f1a0b3c5d7e9f2a4b6c8d0e1f3a5b7c9d1e3f5a7b9c1d3e5f7a` |
| **`SESSION_SECRET`** | `1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a8f9a2b7c4d5e6f1a0b3c5d7e9f` |
| **`APP_BASE_URL`** | `https://your-app-name.vercel.app` |
| **`CORS_ORIGIN`** | `https://your-app-name.vercel.app` |

---

## 3. Alternative: Deploy via Vercel CLI

If you prefer deploying directly from your terminal:

```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod
```

---

## 4. How Vercel Deployment Works

- **Frontend SPA**: The built React application is served globally via Vercel's Edge Network CDN (`artifacts/sankara-eye/dist/public`).
- **Backend Express API**: Requests to `/api/*` and `/health` are routed to the Node.js Serverless Function (`api/index.ts`).
- **Database Seeding**: Initial superadmin accounts (`admin@sankaraeye.com`, `dean@sankaraeye.com`) and all 16 hospital units are automatically synced to your database on cold/warm starts.
