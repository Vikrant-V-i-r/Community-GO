# Community Hero — Dockerfile for Google Cloud Run
# Multi-stage build for Next.js 16 standalone output

# ---- Stage 1: Dependencies ----
FROM oven/bun:1.3 AS deps
WORKDIR /app

# Copy lockfile + package.json for cacheable install
COPY package.json bun.lock* ./
COPY prisma ./prisma

# Install deps (use frozen lockfile for reproducibility)
RUN bun install --frozen-lockfile

# ---- Stage 2: Build ----
FROM oven/bun:1.3 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js to build standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/community-hero.db

# Generate Prisma client + build Next.js
RUN bun run db:generate
RUN bun run build

# ---- Stage 3: Runtime ----
FROM oven/bun:1.3 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV DATABASE_URL=file:/app/data/community-hero.db

# Non-root user for Cloud Run security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create data dir for SQLite
RUN mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app/data /app/public/uploads

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy package.json for running scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 8080

# Run DB migrations + seed on first boot, then start
CMD ["sh", "-c", "bun run db:push && bun run scripts/seed.ts && node server.js"]
