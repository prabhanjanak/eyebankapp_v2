# ==============================================================================
# SANKARA EYE BANK & DONATION SYSTEM - PRODUCTION DOCKERFILE
# Multi-stage build for minimal image size and fast startup
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
RUN apk add --no-cache libc6-compat

# ------------------------------------------------------------------------------
# Stage 2: Dependencies & Build
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY artifacts/sankara-eye/package.json ./artifacts/sankara-eye/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY scripts/package.json ./scripts/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Run Typecheck and Production Build
ENV NODE_ENV=production
RUN pnpm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for container health check
RUN apk add --no-cache curl libc6-compat
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

ENV NODE_ENV=production
ENV PORT=8080

# Create runtime directories
RUN mkdir -p /app/data /app/logs /app/uploads

# Copy required workspace configuration and dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/tsconfig.json ./

# Copy compiled backend bundles
COPY --from=builder /app/artifacts/api-server ./artifacts/api-server

# Copy compiled frontend SPA static assets
COPY --from=builder /app/artifacts/sankara-eye/dist ./artifacts/sankara-eye/dist

# Copy database migrations & schema for startup synchronization
COPY --from=builder /app/lib/db ./lib/db
COPY --from=builder /app/lib/api-zod ./lib/api-zod
COPY --from=builder /app/lib/api-spec ./lib/api-spec
COPY --from=builder /app/lib/api-client-react ./lib/api-client-react

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose HTTP port
EXPOSE 8080

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
