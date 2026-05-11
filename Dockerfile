# Stage 1: Build client
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
# Skip Chromium download in CI/build — PDF will use puppeteer at runtime in app container
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm ci

COPY . .
RUN npm run build:client && npm run build:server

# Stage 2: Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install Chromium for Puppeteer PDF support
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
# Keep template path consistent with process.cwd() based lookup
COPY --from=builder /app/src/server/reports/templates ./src/server/reports/templates
COPY --from=builder /app/migrations ./migrations

RUN mkdir -p data/reports logs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server/server/index.js"]
