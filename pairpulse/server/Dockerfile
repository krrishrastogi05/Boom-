# Multi-stage production Dockerfile for PairPulse Relay
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
