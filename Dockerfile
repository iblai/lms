# Stage 0: Base
FROM node:20 AS base
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Node 25.3.0 via n
RUN npm install -g n && n 25.3.0 && hash -r

# Enable Corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests first (for layer caching)
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 1: Builder
FROM base AS builder
ARG APP_VERSION
ENV NODE_OPTIONS="--max-old-space-size=4096"
COPY . .

# Override version in package.json if APP_VERSION is provided
RUN if [ -n "$APP_VERSION" ]; then \
      sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$APP_VERSION\"/" package.json; \
    fi
    
RUN pnpm run build

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
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Ensure Next.js and dependencies are available during runtime
COPY --from=builder /app/node_modules ./node_modules

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["pnpm", "exec", "next", "start", "-p", "5000"]
