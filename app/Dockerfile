# ==========================================
# STAGE 1: Dependency & Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for builds/checks)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Prune devDependencies for a lean production bundle
RUN npm prune --production

# ==========================================
# STAGE 2: Production Runtime Stage
# ==========================================
FROM node:20-alpine AS runner

# Security: Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /usr/src/app

# Copy production node_modules and application code from builder
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/src ./src
COPY --from=builder --chown=node:node /usr/src/app/package.json ./package.json

# Security Best Practice: Run container as non-root user (node)
USER node

# Expose application port
EXPOSE 3000

# Healthcheck inside container
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

# Start the application
CMD ["node", "src/server.js"]

