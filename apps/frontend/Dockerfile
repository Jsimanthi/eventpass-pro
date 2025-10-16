# Multi-stage build for React/Vite frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/frontend/ ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
