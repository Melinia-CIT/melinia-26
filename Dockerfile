FROM oven/bun:1.3.4 AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/outreach/package.json ./apps/outreach/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

COPY apps/api/src ./apps/api/src
COPY packages/shared/src ./packages/shared/src

WORKDIR /app/apps/api
RUN bun run build

FROM oven/bun:1.3.4 AS runner
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3000

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/outreach/package.json ./apps/outreach/
COPY packages/shared/package.json ./packages/shared/

# 6. Install only production dependencies (smaller image size)
RUN bun install --frozen-lockfile --production

# 7. Copy built artifacts from builder
COPY --from=builder /app/apps/api/dist ./dist

CMD ["bun", "run", "dist/index.js"]
