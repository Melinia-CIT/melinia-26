FROM oven/bun:1.3.4-alpine AS base
WORKDIR /app

FROM base AS deps
COPY bun.lock package.json turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN bun install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN bun run build:api

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=deps /app/apps/api/package.json ./package.json
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run --eval "fetch('http://localhost:3000/api/v1/ping').then(r=>r.ok?0:1)"
CMD ["bun", "run", "dist/index.js"]
