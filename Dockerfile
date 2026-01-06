FROM oven/bun:1.3.4-alpine AS base
WORKDIR /app

FROM base AS deps-context
COPY bun.lock package.json turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Dev Deps
FROM deps-context AS dev-deps
RUN bun install --frozen-lockfile

# Builder 
FROM dev-deps AS builder
RUN bun run build

# Prod Deps
FROM base AS prod-deps
COPY bun.lock package.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN bun install --frozen-lockfile --production

# ---------------------------------------------------------
# ARTIFACTS STAGE
# ---------------------------------------------------------
FROM builder AS artifacts
WORKDIR /app
RUN mkdir -p /prod

# 1. Copy ALL 'dist' folders from apps and packages
RUN find apps packages -type d -name "dist" | tar c -T - | tar x -C /prod

# 2. Copy package.json files (needed for node_modules resolution in monorepos)
RUN find apps packages -name "package.json" | tar c -T - | tar x -C /prod

# ---------------------------------------------------------
# RUNNER STAGE
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app
EXPOSE 3000

COPY --from=prod-deps /app/node_modules ./node_modules

COPY --from=artifacts /prod/. ./

CMD ["bun", "run", "./apps/api/dist/index.js"]

