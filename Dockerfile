# Community GO — Dockerfile for Google Cloud Run
# Multi-stage build for Next.js 16 standalone output

# ---- Stage 1: Dependencies ----
FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---- Stage 2: Build ----
FROM oven/bun:1.3 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/community-go.db

RUN bun run build

# ---- Stage 3: Runtime ----
FROM oven/bun:1.3 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV DATABASE_URL=file:/app/data/community-go.db
# GEMINI_API_KEY is set via Cloud Run environment variables (not baked in for security)

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app/data /app/public/uploads

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 8080

# App uses localStorage (browser-side) — no DB migrations or seeding needed on server
CMD ["node", "server.js"]
