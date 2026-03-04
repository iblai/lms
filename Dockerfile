# Stage 0: Base
FROM node:20 AS base
WORKDIR /repo

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Node 25.3.0 via n
RUN npm install -g n && n 25.3.0 && hash -r

# Enable Corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo configs and lockfile
COPY pnpm-workspace.yaml .
COPY turbo.json .
COPY package.json .
COPY pnpm-lock.yaml .

# Add app-specific package.json
COPY apps/skills/package.json ./apps/skills/package.json

# Add all packages for workspace resolution
COPY packages ./packages

# 🔥 Add 'next' to root devDependencies before this step
RUN pnpm install

# Stage 1: Builder
FROM base AS builder
ENV NODE_OPTIONS="--max-old-space-size=4096"
COPY . .
RUN pnpm run build --filter=ibl-web-nextjs-skills-spa

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install Node 25.3.0 (download official musl binary for Alpine)
RUN apk add --no-cache libstdc++ \
    && wget -qO- https://unofficial-builds.nodejs.org/download/release/v25.3.0/node-v25.3.0-linux-x64-musl.tar.gz | tar xz -C /usr/local --strip-components=1 \
    && node --version

# Enable Corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built app artifacts
COPY --from=builder /repo/apps/skills/.next .next
COPY --from=builder /repo/apps/skills/public ./public
COPY --from=builder /repo/apps/skills/package.json ./package.json
COPY --from=builder /repo/apps/skills/next.config.ts ./next.config.ts
COPY --from=builder /repo/apps/skills/entrypoint.sh ./entrypoint.sh

# Ensure Next.js and dependencies are available during runtime
COPY --from=builder /repo/node_modules ./node_modules
# COPY --from=builder /repo/apps/mentor/node_modules ./node_modules
RUN pnpm ls next
RUN ls node_modules
# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

EXPOSE 5000

# ✅ Use pnpm exec now that next is available globally
CMD ["pnpm", "exec", "next", "start", "-p", "5000"]
