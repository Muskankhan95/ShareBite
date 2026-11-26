# ==============================================================================
# FoodRescue Multi-Stage Production Dockerfile
# ==============================================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ sqlite
WORKDIR /app

# 1. Install dependencies based on the preferred package manager
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create persistent storage directories
RUN mkdir -p /app/data /app/logs /app/backups && chown -R nextjs:nodejs /app/data /app/logs /app/backups

COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/impact || exit 1

CMD ["npm", "start"]
