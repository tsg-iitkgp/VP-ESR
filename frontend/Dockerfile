# Frontend Dockerfile - Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Accept build arguments
ARG VITE_APP_API_PREFIX
ARG VITE_ADMIN_LOGIN_URL
ENV VITE_APP_API_PREFIX=$VITE_APP_API_PREFIX
ENV VITE_ADMIN_LOGIN_URL=$VITE_ADMIN_LOGIN_URL

# Copy package files first
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Fail the build if required frontend build-time env vars are missing
RUN test -n "$VITE_APP_API_PREFIX" && test -n "$VITE_ADMIN_LOGIN_URL"

# Create production build
RUN npm run build

# Production stage without nginx
FROM node:18-alpine AS production
WORKDIR /app

RUN npm install -g serve@14.2.4

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
   CMD node -e "const p=process.env.FRONTEND_PORT; if(!p){process.exit(1)} fetch('http://localhost:'+p+'/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start static server
CMD ["sh", "-c", "test -n \"$FRONTEND_PORT\" && serve -s dist -l \"$FRONTEND_PORT\""]