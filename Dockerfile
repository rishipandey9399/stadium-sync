# Node.js 22 LTS for production stability
FROM node:22-slim AS builder

WORKDIR /app

# Copy root manifests
COPY package*.json ./
# Copy frontend manifests
COPY frontend/package*.json ./frontend/

# Install dependencies (frozen lockfile for production)
RUN npm ci
RUN cd frontend && npm ci

# Copy source
COPY . .

# Build frontend production bundle
RUN npm run build

# --- Runtime Stage ---
FROM node:22-slim

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
# Cloud Run injects PORT environment variable (defaults to 8080)
ENV PORT=8080

# Copy necessary production files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/services ./services
COPY --from=builder /app/frontend/dist ./frontend/dist

# Non-root user for security
USER node

# Expose port
EXPOSE 8080

# Start the StarndSync Monolith
CMD ["node", "backend/server.cjs"]
