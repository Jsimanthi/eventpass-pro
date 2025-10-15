# Dockerfile for the frontend application (Monorepo-Aware)

# Stage 1: Build the application
FROM node:20-alpine as builder

WORKDIR /app

# Copy the frontend-specific files
COPY ./apps/frontend/ ./apps/frontend/

# Set the working directory to the frontend app
WORKDIR /app/apps/frontend

# Install dependencies and build the application
RUN npm install
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the built static files from the builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
