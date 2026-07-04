# ===== Build stage =====
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
RUN pnpm -F @mb/shared build

COPY apps/server/ ./apps/server/
RUN pnpm -F @mb/server build

COPY apps/web/ ./apps/web/
RUN pnpm -F @mb/web build

RUN pnpm prune --prod

# ===== Runtime stage =====
FROM node:20-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

ENV API_PORT=80
EXPOSE 80

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/server/dist/main.js"]
