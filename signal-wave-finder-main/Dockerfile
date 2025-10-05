# Multi-stage build for Vite React app
FROM node:18-alpine AS deps

# Install dependencies based on the preferred package manager
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm install

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Development stage - run in dev mode
FROM node:18-alpine AS runner

WORKDIR /app

# Copy source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 3000

# Start in dev mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
